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
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    // Authenticate user with token
    const clientSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await clientSupabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized user session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Admin client to read & update subscriptions securely
    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

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
          message: "No active paid FastSpring subscription found to cancel.",
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

    let apiSuccess = false;
    let apiErrorMessage = "";

    if (fsUsername && fsPassword) {
      try {
        const credentials = btoa(`${fsUsername}:${fsPassword}`);
        const fsResponse = await fetch(
          `https://api.fastspring.com/subscriptions/${sub.payment_subscription_id}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Basic ${credentials}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (fsResponse.ok) {
          apiSuccess = true;
        } else {
          const errText = await fsResponse.text();
          console.error("FastSpring API cancel failed:", fsResponse.status, errText);
          apiErrorMessage = `FastSpring API error (${fsResponse.status}): ${errText}`;
        }
      } catch (err: any) {
        console.error("FastSpring API request error:", err);
        apiErrorMessage = err.message || "Failed to reach FastSpring API";
      }
    } else {
      console.warn(
        "FASTSPRING_API_USERNAME or FASTSPRING_API_PASSWORD environment secrets not configured in Supabase. Proceeding to update database subscription status."
      );
    }

    // Update subscription in database to marked canceled/canceled at period end
    const { error: updateError } = await adminSupabase
      .from("subscriptions")
      .update({
        cancel_at_period_end: true,
        status: "canceled",
        updated_at: new Date().toISOString(),
      })
      .eq("organization_id", profile.organization_id);

    if (updateError) {
      console.error("Error updating local subscription status:", updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        canceledSubscriptionId: sub.payment_subscription_id,
        fastSpringApiCalled: Boolean(fsUsername && fsPassword),
        fastSpringApiSuccess: apiSuccess,
        apiError: apiErrorMessage || undefined,
        message: "Current FastSpring subscription successfully processed for cancellation.",
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
