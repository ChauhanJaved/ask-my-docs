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
 * Resolves plan ID from product path or sku string
 */
function resolvePlanId(productPath?: string | null): string | undefined {
  if (!productPath) return undefined;
  const lower = productPath.toLowerCase();
  if (PRODUCT_TO_PLAN[lower]) return PRODUCT_TO_PLAN[lower];
  if (lower.includes("business")) return "business";
  if (lower.includes("pro")) return "pro";
  if (lower.includes("starter")) return "starter";
  if (lower.includes("free")) return "free";
  return undefined;
}

/**
 * Verifies FastSpring HMAC SHA256 base64 signature
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
      ["sign"]
    );

    const signatureBytes = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
    const expectedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBytes)));
    return expectedSignature === signature;
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

    // Optional HMAC signature check if secret is configured
    if (hmacSecret) {
      const isValid = await verifyFastSpringSignature(rawBody, signature, hmacSecret);
      if (!isValid) {
        console.warn("Invalid FastSpring HMAC signature detected.");
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const payload = JSON.parse(rawBody);
    const events = payload.events || [];

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    for (const event of events) {
      const eventType = event.type;
      const data = event.data || {};

      // Extract organizationId from all potential tag locations
      const organizationId =
        data.tags?.organization_id ||
        data.account?.tags?.organization_id ||
        data.tags?.org_id ||
        data.custom?.organization_id ||
        data.items?.[0]?.tags?.organization_id ||
        data.subscriptions?.[0]?.tags?.organization_id ||
        data.subscriptions?.[0]?.subscribers?.[0]?.tags?.organization_id;

      const subscriptionId =
        data.subscription ||
        data.id ||
        data.subscriptions?.[0]?.id ||
        data.subscriptions?.[0]?.subscription;

      const customerId =
        (typeof data.account === "string" ? data.account : data.account?.id) ||
        (typeof data.customer === "string" ? data.customer : data.customer?.id) ||
        data.subscriptions?.[0]?.customer;

      let productPath = data.product;
      if (!productPath && data.items && data.items.length > 0) {
        productPath = data.items[0].product || data.items[0].path || data.items[0].sku;
      }

      const targetPlan = resolvePlanId(productPath);

      // Extract period start and end dates
      const rawStart = data.begin || data.started || data.currentPeriodStart || data.beginInflowDate || data.created;
      const periodStart = rawStart ? new Date(rawStart).toISOString() : new Date().toISOString();

      const rawEnd = data.nextInflowDate || data.end || data.currentPeriodEnd || data.nextInflow;
      const periodEnd = rawEnd ? new Date(rawEnd).toISOString() : null;

      console.log(`Processing event: ${eventType}, org: ${organizationId}, sub: ${subscriptionId}, plan: ${targetPlan}`);

      const upsertSubscription = async (updateData: Record<string, any>) => {
        updateData.updated_at = new Date().toISOString();

        let targetOrgId = organizationId;

        // If organizationId is missing in payload tags, lookup existing row by payment_subscription_id
        if (!targetOrgId && subscriptionId) {
          const { data: existingSub } = await supabase
            .from("subscriptions")
            .select("organization_id")
            .eq("payment_subscription_id", subscriptionId)
            .maybeSingle();

          if (existingSub?.organization_id) {
            targetOrgId = existingSub.organization_id;
          }
        }

        if (targetOrgId) {
          const { error } = await supabase.from("subscriptions").upsert(
            {
              organization_id: targetOrgId,
              ...updateData,
            },
            { onConflict: "organization_id" }
          );

          if (error) {
            console.error(`Supabase upsert error for org ${targetOrgId}:`, error);
          } else {
            console.log(`Successfully upserted subscription for org ${targetOrgId}`);
          }
        } else {
          console.warn("Could not determine organization_id for event:", eventType, data);
        }
      };

      switch (eventType) {
        case "order.completed":
        case "subscription.activated":
        case "subscription.charge.completed":
          await upsertSubscription({
            payment_provider: "fastspring",
            ...(targetPlan ? { plan: targetPlan } : {}),
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
            status: "active",
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
        case "return.created":
          await upsertSubscription({
            plan: "free",
            status: "deactivated",
          });
          break;

        default:
          console.log(`Unhandled event type: ${eventType}`);
          break;
      }
    }

    return new Response(JSON.stringify({ success: true }), {
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
