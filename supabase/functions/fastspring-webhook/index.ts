import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-fs-signature",
};

const PRODUCT_TO_PLAN: Record<string, string> = {
  "ftchat-starter-monthly": "starter",
  "ftchat-starter-yearly": "starter",
  "ftchat-pro-monthly": "pro",
  "ftchat-pro-yearly": "pro",
  "ftchat-business-monthly": "business",
  "ftchat-business-yearly": "business",
};

/**
 * Extracts product path string from various FastSpring payload locations
 * (handles strings or expanded objects with .product, .path, or .sku)
 */
function extractProductPath(data: any): string | undefined {
  if (!data) return undefined;

  // Direct product property (string or object)
  if (typeof data.product === "string") return data.product;
  if (data.product && typeof data.product === "object") {
    const p = data.product.product || data.product.path || data.product.sku;
    if (typeof p === "string") return p;
  }

  // Items array (e.g. order.completed)
  if (Array.isArray(data.items) && data.items.length > 0) {
    const item = data.items[0];
    if (typeof item === "string") return item;
    if (typeof item.product === "string") return item.product;
    if (typeof item.path === "string") return item.path;
    if (typeof item.sku === "string") return item.sku;
    if (item.product && typeof item.product === "object") {
      const p = item.product.product || item.product.path || item.product.sku;
      if (typeof p === "string") return p;
    }
  }

  // Subscriptions array
  if (Array.isArray(data.subscriptions) && data.subscriptions.length > 0) {
    const sub = data.subscriptions[0];
    if (typeof sub === "object") {
      const subProduct = extractProductPath(sub);
      if (subProduct) return subProduct;
    }
  }

  // Nested subscription object
  if (data.subscription && typeof data.subscription === "object") {
    const subProduct = extractProductPath(data.subscription);
    if (subProduct) return subProduct;
  }

  // Order object
  if (data.order && typeof data.order === "object") {
    const orderProduct = extractProductPath(data.order);
    if (orderProduct) return orderProduct;
  }

  return undefined;
}

/**
 * Resolves plan ID from product path or sku string
 */
function resolvePlanId(productPath?: any): string | undefined {
  if (!productPath) return undefined;
  const pathStr =
    typeof productPath === "string"
      ? productPath
      : productPath.product || productPath.path || productPath.sku || "";
  if (!pathStr || typeof pathStr !== "string") return undefined;
  const lower = pathStr.toLowerCase();
  if (PRODUCT_TO_PLAN[lower]) return PRODUCT_TO_PLAN[lower];
  if (lower.includes("business")) return "business";
  if (lower.includes("pro")) return "pro";
  if (lower.includes("starter")) return "starter";
  if (lower.includes("free")) return "free";
  return undefined;
}

/**
 * Verifies FastSpring HMAC SHA256 base64 signature using constant-time verification
 */
async function verifyFastSpringSignature(
  rawBody: string,
  signature: string | null,
  secret: string
): Promise<boolean> {
  if (!signature || !secret) return false;

  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(rawBody);

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const binarySignature = atob(signature.trim());
    const signatureBytes = new Uint8Array(binarySignature.length);
    for (let i = 0; i < binarySignature.length; i++) {
      signatureBytes[i] = binarySignature.charCodeAt(i);
    }

    return await crypto.subtle.verify("HMAC", cryptoKey, signatureBytes, messageData);
  } catch (err) {
    console.error("Signature verification error:", err);
    return false;
  }
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-fs-signature");
    const hmacSecret = Deno.env.get("FASTSPRING_HMAC_SECRET");

    // Fail closed: Webhooks must never be processed if HMAC secret is not configured
    if (!hmacSecret) {
      console.error(
        "FASTSPRING_HMAC_SECRET environment variable is missing or empty. FastSpring webhooks are rejected until configured."
      );
      return new Response(
        JSON.stringify({ error: "Server misconfiguration: HMAC secret is required" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Fail closed: Reject requests missing the signature header
    if (!signature) {
      console.warn("FastSpring webhook rejected: missing x-fs-signature header.");
      return new Response(JSON.stringify({ error: "Missing signature header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify HMAC signature
    const isValid = await verifyFastSpringSignature(rawBody, signature, hmacSecret);
    if (!isValid) {
      console.warn("Invalid FastSpring HMAC signature detected.");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = JSON.parse(rawBody);
    const events = payload.events || [];

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const eventResults: Array<{ id?: string; type?: string; status: string; error?: string }> = [];

    for (const event of events) {
      const eventId = event.id;
      const eventType = event.type;
      const data = event.data || {};

      try {
        // Idempotency: Prevent duplicate processing of retried webhook events
        if (eventId) {
          try {
            const { data: processedEvent, error: checkError } = await supabase
              .from("webhook_events")
              .select("id")
              .eq("id", eventId)
              .maybeSingle();

            if (!checkError && processedEvent) {
              console.log(`Event ${eventId} (${eventType}) was already processed. Skipping duplicate.`);
              eventResults.push({ id: eventId, type: eventType, status: "skipped_duplicate" });
              continue;
            }
          } catch {
            // Table may not exist yet if migration pending; safe to continue
          }
        }

        // Extract organizationId from all potential tag locations
        const organizationId =
          data.tags?.organization_id ||
          data.account?.tags?.organization_id ||
          data.tags?.org_id ||
          data.custom?.organization_id ||
          data.items?.[0]?.tags?.organization_id ||
          data.subscriptions?.[0]?.tags?.organization_id ||
          data.subscriptions?.[0]?.subscribers?.[0]?.tags?.organization_id;

        // Fallback: Extract customer email if organization tags are missing
        const customerEmail =
          data.customer?.email ||
          data.account?.contact?.email ||
          data.recipient?.email ||
          data.order?.customer?.email ||
          (typeof data.customer === "string" && data.customer.includes("@") ? data.customer : undefined) ||
          (typeof data.account === "string" && data.account.includes("@") ? data.account : undefined);

        const subscriptionId =
          data.subscriptions?.[0]?.id ||
          data.subscriptions?.[0]?.subscription ||
          data.items?.[0]?.subscription ||
          data.subscription ||
          (eventType.startsWith("subscription.") ? data.id : null);

        const customerId =
          (typeof data.account === "string" ? data.account : data.account?.id) ||
          (typeof data.customer === "string" ? data.customer : data.customer?.id) ||
          data.subscriptions?.[0]?.customer;

        const productPath = extractProductPath(data);
        const targetPlan = resolvePlanId(productPath);

        // Extract event timestamp for monotonic ordering
        const rawEventTime = event.liveDate || event.timestamp || data.changed;
        const eventTime = rawEventTime ? new Date(rawEventTime).toISOString() : null;

        // Extract period start and end dates (support timestamp numbers or ISO strings)
        const rawStart =
          data.begin ||
          data.started ||
          data.currentPeriodStart ||
          data.beginInflowDate ||
          data.created;
        const periodStart = rawStart ? new Date(rawStart).toISOString() : new Date().toISOString();

        const rawEnd =
          data.nextChargeDate ||
          data.next ||
          data.nextValue ||
          data.nextInflowDate ||
          data.end ||
          data.currentPeriodEnd ||
          data.nextInflow ||
          data.deactivation;
        const periodEnd = rawEnd ? new Date(rawEnd).toISOString() : null;

        // Extract billing interval (monthly vs yearly)
        let billingInterval: string | undefined = undefined;
        const intervalUnit =
          data.intervalUnit ||
          data.subscription?.intervalUnit ||
          data.subscriptions?.[0]?.intervalUnit;
        const pathLower = (productPath || "").toLowerCase();

        if (intervalUnit === "year" || pathLower.includes("yearly") || pathLower.includes("annual")) {
          billingInterval = "yearly";
        } else if (intervalUnit === "month" || pathLower.includes("monthly")) {
          billingInterval = "monthly";
        }

        // If intervalUnit is not provided directly (e.g. in subscription.charge.completed),
        // determine interval dynamically from period duration (>60 days is yearly, ~30 days is monthly)
        if (!billingInterval && periodStart && periodEnd) {
          const startMs = new Date(periodStart).getTime();
          const endMs = new Date(periodEnd).getTime();
          const diffDays = Math.round((endMs - startMs) / (1000 * 60 * 60 * 24));
          if (diffDays > 60) {
            billingInterval = "yearly";
          } else if (diffDays > 10) {
            billingInterval = "monthly";
          }
        }

        // Extract price display and currency
        const priceDisplay =
          data.nextChargeTotalDisplay ||
          data.priceDisplay ||
          data.subtotalDisplay ||
          data.totalDisplay ||
          null;
        const currency = data.nextChargeCurrency || data.currency || null;

        console.log(
          `Processing event: ${eventType}, org: ${organizationId}, sub: ${subscriptionId}, plan: ${targetPlan}, interval: ${billingInterval}`
        );

        const upsertSubscription = async (updateData: Record<string, any>) => {
          updateData.updated_at = new Date().toISOString();

          let targetOrgId = organizationId;
          let existingSub: any = null;

          // 1. Lookup existing record by org ID
          if (targetOrgId) {
            const { data: byOrg, error: byOrgError } = await supabase
              .from("subscriptions")
              .select("*")
              .eq("organization_id", targetOrgId)
              .maybeSingle();

            if (byOrgError) {
              console.error(`Supabase select error for org ${targetOrgId}:`, byOrgError);
              throw byOrgError;
            }
            existingSub = byOrg;
          }

          // 2. Lookup existing record by subscription ID
          if (!existingSub && subscriptionId) {
            const { data: bySub, error: bySubError } = await supabase
              .from("subscriptions")
              .select("*")
              .eq("payment_subscription_id", subscriptionId)
              .maybeSingle();

            if (bySubError) {
              console.error(`Supabase select error for sub ${subscriptionId}:`, bySubError);
              throw bySubError;
            }
            existingSub = bySub;
          }

          // 3. Fallback: Lookup organization by customer email if tags were stripped
          if (!targetOrgId && !existingSub && customerEmail) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("organization_id")
              .eq("email", customerEmail.toLowerCase().trim())
              .maybeSingle();

            if (profile?.organization_id) {
              targetOrgId = profile.organization_id;
              console.log(
                `Resolved organization_id ${targetOrgId} via customer email fallback: ${customerEmail}`
              );

              const { data: byOrg } = await supabase
                .from("subscriptions")
                .select("*")
                .eq("organization_id", targetOrgId)
                .maybeSingle();

              if (byOrg) {
                existingSub = byOrg;
              }
            }
          }

          if (existingSub?.organization_id) {
            targetOrgId = existingSub.organization_id;
          }

          if (!targetOrgId) {
            const msg = `Could not determine organization_id for event: ${eventType}`;
            console.error(msg, data);
            throw new Error(msg);
          }

          if (existingSub) {
            // Out-of-order event guard:
            // FastSpring does not guarantee delivery order. A delayed subscription.deactivated or
            // subscription.canceled from an older subscription must not downgrade or cancel an organization
            // that has since re-subscribed or is currently on a different subscription.
            if (
              eventType === "subscription.deactivated" ||
              eventType === "subscription.canceled"
            ) {
              if (!subscriptionId || subscriptionId !== existingSub.payment_subscription_id) {
                console.warn(
                  `Ignoring out-of-order ${eventType} for subscription '${subscriptionId}'. ` +
                    `Organization ${targetOrgId} active subscription is '${existingSub.payment_subscription_id}'.`
                );
                return;
              }
            }

            // Also guard against other subscription-scoped lifecycle events (e.g. past_due, paused, or updated)
            // arriving from an obsolete subscription.
            if (
              (eventType === "subscription.charge.failed" ||
                eventType === "subscription.paused" ||
                eventType === "subscription.updated") &&
              existingSub.payment_subscription_id &&
              subscriptionId &&
              subscriptionId !== existingSub.payment_subscription_id
            ) {
              console.warn(
                `Ignoring out-of-order ${eventType} for subscription '${subscriptionId}'. ` +
                  `Organization ${targetOrgId} active subscription is '${existingSub.payment_subscription_id}'.`
              );
              return;
            }

            // Monotonic event ordering guard (for the same subscription):
            // If the table contains last_event_timestamp and the incoming event is older than the last processed event, skip it.
            if (
              "last_event_timestamp" in existingSub &&
              existingSub.last_event_timestamp &&
              eventTime &&
              new Date(eventTime).getTime() < new Date(existingSub.last_event_timestamp).getTime()
            ) {
              console.warn(
                `Ignoring older event ${eventType} (${eventTime}) for org ${targetOrgId}. ` +
                  `Last processed event was at ${existingSub.last_event_timestamp}.`
              );
              return;
            }

            if ("last_event_timestamp" in existingSub && eventTime) {
              updateData.last_event_timestamp = eventTime;
            }

            // CRITICAL: When updating an existing row, never let missing/undefined plan
            // revert a paid customer back to 'free'. Only explicit deactivation sets 'free'.
            if (!updateData.plan && existingSub.plan) {
              updateData.plan = existingSub.plan;
            }
            if (!updateData.payment_subscription_id && existingSub.payment_subscription_id) {
              updateData.payment_subscription_id = existingSub.payment_subscription_id;
            }
            if (!updateData.payment_customer_id && existingSub.payment_customer_id) {
              updateData.payment_customer_id = existingSub.payment_customer_id;
            }

            const { error } = await supabase
              .from("subscriptions")
              .update(updateData)
              .eq("organization_id", targetOrgId);

            if (error) {
              console.error(`Supabase update error for org ${targetOrgId}:`, error);
              throw error;
            }

            console.log(
              `Successfully updated subscription for org ${targetOrgId}: plan=${updateData.plan}, interval=${updateData.billing_interval}, status=${updateData.status}`
            );
          } else {
            // If no existing record exists, do not create a deactivated or canceled record from late events
            if (
              eventType === "subscription.deactivated" ||
              eventType === "subscription.canceled"
            ) {
              console.warn(
                `Ignoring ${eventType} for subscription '${subscriptionId}': no existing subscription record found for org ${targetOrgId}.`
              );
              return;
            }

            // Insert brand new subscription record
            const newRecord = {
              organization_id: targetOrgId,
              plan: updateData.plan || "free",
              status: updateData.status || "active",
              ...(eventTime ? { last_event_timestamp: eventTime } : {}),
              ...updateData,
            };

            const { error } = await supabase
              .from("subscriptions")
              .upsert(newRecord, { onConflict: "organization_id" });

            if (error) {
              console.error(`Supabase insert error for org ${targetOrgId}:`, error);
              throw error;
            }

            console.log(`Successfully created subscription for org ${targetOrgId}`);
          }
        };

        switch (eventType) {
          case "order.completed":
          case "subscription.activated":
          case "subscription.charge.completed":
            await upsertSubscription({
              payment_provider: "fastspring",
              ...(targetPlan ? { plan: targetPlan } : {}),
              ...(billingInterval ? { billing_interval: billingInterval } : {}),
              ...(priceDisplay ? { price_display: priceDisplay } : {}),
              ...(currency ? { currency } : {}),
              ...(customerId ? { payment_customer_id: customerId } : {}),
              ...(subscriptionId ? { payment_subscription_id: subscriptionId } : {}),
              status: "active",
              cancel_at_period_end: false,
              current_period_start: periodStart,
              ...(periodEnd ? { current_period_end: periodEnd } : {}),
            });
            break;

          case "subscription.updated":
            await upsertSubscription({
              payment_provider: "fastspring",
              ...(targetPlan ? { plan: targetPlan } : {}),
              ...(billingInterval ? { billing_interval: billingInterval } : {}),
              ...(priceDisplay ? { price_display: priceDisplay } : {}),
              ...(currency ? { currency } : {}),
              ...(customerId ? { payment_customer_id: customerId } : {}),
              ...(subscriptionId ? { payment_subscription_id: subscriptionId } : {}),
              status: "active",
              cancel_at_period_end: false,
              current_period_start: periodStart,
              ...(periodEnd ? { current_period_end: periodEnd } : {}),
            });
            break;

          case "subscription.charge.failed":
            await upsertSubscription({
              status: "past_due",
            });
            break;

          case "subscription.canceled":
            await upsertSubscription({
              status: "canceled",
              cancel_at_period_end: true,
              ...(periodEnd ? { current_period_end: periodEnd } : {}),
            });
            break;

          case "subscription.uncanceled":
          case "subscription.resumed":
            await upsertSubscription({
              status: "active",
              cancel_at_period_end: false,
            });
            break;

          case "subscription.paused":
            await upsertSubscription({
              status: "paused",
            });
            break;

          case "subscription.deactivated":
            await upsertSubscription({
              plan: "free",
              status: "deactivated",
              cancel_at_period_end: false,
              billing_interval: null,
              price_display: null,
            });
            break;

          case "return.created":
            // Prorated refund/return occurs when switching between monthly & yearly cycles
            // or adjusting tiers. This must NOT deactivate the subscription or revert to 'free'.
            console.log(`Prorated return/refund registered for sub: ${subscriptionId}, org: ${organizationId || 'lookup'}`);
            break;

          default:
            console.log(`Unhandled event type: ${eventType}`);
            break;
        }

        // Record successful event processing for idempotency
        if (eventId) {
          try {
            await supabase.from("webhook_events").insert({
              id: eventId,
              provider: "fastspring",
              event_type: eventType,
            });
          } catch {
            // Table may not exist yet or duplicate insert; safe to ignore
          }
        }

        eventResults.push({ id: eventId, type: eventType, status: "success" });
      } catch (eventErr: any) {
        console.error(`Failed processing event ${eventId || "unknown"} (${eventType}):`, eventErr);
        eventResults.push({ id: eventId, type: eventType, status: "error", error: eventErr.message });
      }
    }

    return new Response(JSON.stringify({ success: true, results: eventResults }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("FastSpring webhook error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
