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

      const organizationId =
        data.tags?.organization_id ||
        data.account?.tags?.organization_id ||
        data.tags?.org_id;

      const subscriptionId = data.subscription || data.id;
      const customerId = data.account || data.customer;

      let productPath = data.product;
      if (!productPath && data.items && data.items.length > 0) {
        productPath = data.items[0].product;
      }

      const targetPlan = productPath ? PRODUCT_TO_PLAN[productPath] : undefined;
      const nextInflowDate = data.nextInflowDate || data.end;
      const periodEnd = nextInflowDate ? new Date(nextInflowDate).toISOString() : null;

      console.log(`Processing event: ${eventType}, org: ${organizationId}, sub: ${subscriptionId}`);

      const updateSubscription = async (updateData: Record<string, any>) => {
        updateData.updated_at = new Date().toISOString();
        if (organizationId) {
          await supabase.from("subscriptions").update(updateData).eq("organization_id", organizationId);
        } else if (subscriptionId) {
          await supabase.from("subscriptions").update(updateData).eq("payment_subscription_id", subscriptionId);
        }
      };

      switch (eventType) {
        case "subscription.charge.completed":
        case "order.completed":
          await updateSubscription({
            payment_provider: "fastspring",
            ...(targetPlan ? { plan: targetPlan } : {}),
            ...(customerId ? { payment_customer_id: customerId } : {}),
            ...(subscriptionId ? { payment_subscription_id: subscriptionId } : {}),
            status: "active",
            ...(periodEnd ? { current_period_end: periodEnd } : {}),
          });
          break;

        case "subscription.updated":
          await updateSubscription({
            payment_provider: "fastspring",
            ...(targetPlan ? { plan: targetPlan } : {}),
            status: "active",
            ...(periodEnd ? { current_period_end: periodEnd } : {}),
          });
          break;

        case "subscription.charge.failed":
          await updateSubscription({
            status: "past_due",
          });
          break;

        case "subscription.canceled":
          await updateSubscription({
            status: "canceled",
          });
          break;

        case "subscription.uncanceled":
          await updateSubscription({
            status: "active",
          });
          break;

        case "subscription.deactivated":
        case "return.created":
          await updateSubscription({
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
