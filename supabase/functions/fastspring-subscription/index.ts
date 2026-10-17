import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace(/^Bearer\s+/i, "");
    const {
      data: { user },
      error: authError,
    } = await adminSupabase.auth.getUser(token);

    if (authError || !user) {
      console.error("Auth error in edge function:", authError);
      return new Response(
        JSON.stringify({ error: `Unauthorized user session: ${authError?.message || "Invalid token"}` }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Fetch user profile
    const { data: profile, error: profileError } = await adminSupabase
      .from("profiles")
      .select("organization_id, role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.organization_id) {
      return new Response(JSON.stringify({ error: "User profile or organization not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!["owner", "admin"].includes(profile.role)) {
      return new Response(
        JSON.stringify({ error: "Only organization Owners and Admins can manage subscriptions." }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action || "cancel";

    // Fetch current subscription
    const { data: sub, error: subError } = await adminSupabase
      .from("subscriptions")
      .select("payment_subscription_id, payment_provider, status, plan")
      .eq("organization_id", profile.organization_id)
      .maybeSingle();

    if (subError) {
      return new Response(JSON.stringify({ error: "Failed to fetch subscription records" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!sub || sub.plan === "free" || !sub.payment_subscription_id) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No active paid FastSpring subscription found to manage.",
          alreadyCanceled: true,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const fsUsername = Deno.env.get("FASTSPRING_API_USERNAME");
    const fsPassword = Deno.env.get("FASTSPRING_API_PASSWORD");

    if (!fsUsername || !fsPassword) {
      console.error("Missing FastSpring API credentials in environment secrets.");
      return new Response(
        JSON.stringify({
          error:
            "FastSpring API credentials (FASTSPRING_API_USERNAME, FASTSPRING_API_PASSWORD) are not configured in Supabase secrets.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const credentials = btoa(`${fsUsername}:${fsPassword}`);
    const isResumeAction = action === "resume" || action === "uncancel" || action === "reactivate";
    const isChangePlanAction = action === "change-plan" || action === "upgrade" || action === "downgrade";

    // FastSpring Official Subscription API endpoint
    let fsUrl = `https://api.fastspring.com/subscriptions`;
    let fsMethod = "POST";
    let fsBody: string | undefined = undefined;

    if (isChangePlanAction) {
      if (!body.targetPlan) {
        return new Response(JSON.stringify({ error: "Missing targetPlan for change-plan action." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const targetInterval = body.billingInterval || "monthly";
      const targetProduct = body.product || `ftchat-${body.targetPlan}-${targetInterval}`;

      // Official FastSpring payload to update subscription product in-place:
      // POST https://api.fastspring.com/subscriptions with { subscriptions: [{ subscription: id, product: path, quantity: 1, prorate: boolean, deactivation: null }] }
      fsUrl = `https://api.fastspring.com/subscriptions`;
      fsMethod = "POST";
      fsBody = JSON.stringify({
        subscriptions: [
          {
            subscription: sub.payment_subscription_id,
            product: targetProduct,
            quantity: 1,
            prorate: body.prorate ?? true,
            deactivation: null, // Clear any pending cancellation
          },
        ],
      });
    } else if (isResumeAction) {
      // Official FastSpring payload to resume a canceled subscription:
      // POST https://api.fastspring.com/subscriptions with { subscriptions: [{ subscription: id, deactivation: null }] }
      fsUrl = `https://api.fastspring.com/subscriptions`;
      fsMethod = "POST";
      fsBody = JSON.stringify({
        subscriptions: [
          {
            subscription: sub.payment_subscription_id,
            deactivation: null,
          },
        ],
      });
    } else {
      // Official FastSpring endpoint to cancel subscription at the end of billing period:
      // DELETE https://api.fastspring.com/subscriptions/{subscription_id}?billingPeriod=1
      fsUrl = `https://api.fastspring.com/subscriptions/${sub.payment_subscription_id}?billingPeriod=1`;
      fsMethod = "DELETE";
      fsBody = undefined;
    }

    console.log(`Sending ${action} request to FastSpring API (${fsMethod} ${fsUrl}) for sub: ${sub.payment_subscription_id}`);

    const fsResponse = await fetch(fsUrl, {
      method: fsMethod,
      headers: {
        Authorization: `Basic ${credentials}`,
        Accept: "application/json",
        ...(fsBody ? { "Content-Type": "application/json" } : {}),
      },
      ...(fsBody ? { body: fsBody } : {}),
    });

    if (!fsResponse.ok) {
      const errText = await fsResponse.text();
      console.error(`FastSpring API ${action} failed:`, fsResponse.status, errText);
      return new Response(
        JSON.stringify({
          error: `FastSpring API error (${fsResponse.status}): ${errText}`,
        }),
        {
          status: fsResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const responsePayload = await fsResponse.json().catch(() => ({}));

    // Check if FastSpring reported an error inside the JSON response
    const subResult = responsePayload?.subscriptions?.[0];
    if (subResult && subResult.result === "error") {
      const errorDetail = typeof subResult.error === "object"
        ? JSON.stringify(subResult.error)
        : String(subResult.error || "FastSpring operation failed");
      console.error(`FastSpring API error for ${action}:`, errorDetail);
      return new Response(
        JSON.stringify({
          error: `FastSpring API error: ${errorDetail}`,
          fastSpringResponse: responsePayload,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Immediately update local database record for instant UI feedback
    if (isChangePlanAction) {
      await adminSupabase
        .from("subscriptions")
        .update({
          plan: body.targetPlan,
          ...(body.billingInterval ? { billing_interval: body.billingInterval } : {}),
          cancel_at_period_end: false,
          status: "active",
          updated_at: new Date().toISOString(),
        })
        .eq("organization_id", profile.organization_id);
    } else if (isResumeAction) {
      await adminSupabase
        .from("subscriptions")
        .update({
          cancel_at_period_end: false,
          status: "active",
          updated_at: new Date().toISOString(),
        })
        .eq("organization_id", profile.organization_id);
    } else {
      await adminSupabase
        .from("subscriptions")
        .update({
          cancel_at_period_end: true,
          status: "canceled",
          updated_at: new Date().toISOString(),
        })
        .eq("organization_id", profile.organization_id);
    }

    let responseMessage = "Operation completed successfully.";
    if (isChangePlanAction) {
      responseMessage = `Subscription plan successfully updated to ${body.targetPlan}.`;
    } else if (isResumeAction) {
      responseMessage = "Subscription auto-renewal request sent to FastSpring. Auto-renewal has been resumed.";
    } else {
      responseMessage = "Subscription cancellation request sent to FastSpring. Access remains active until billing period ends.";
    }

    return new Response(
      JSON.stringify({
        success: true,
        action,
        subscriptionId: sub.payment_subscription_id,
        fastSpringResponse: responsePayload,
        message: responseMessage,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error("Edge function error:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
