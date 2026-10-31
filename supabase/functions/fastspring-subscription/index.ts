import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Strict allowlist of recognized actions
const ALLOWED_ACTIONS = [
  "cancel",
  "resume",
  "uncancel",
  "reactivate",
  "change-plan",
  "upgrade",
  "downgrade",
] as const;

type AllowedAction = typeof ALLOWED_ACTIONS[number];

const VALID_PAID_PLANS = ["starter", "pro", "business"] as const;
type PaidPlan = typeof VALID_PAID_PLANS[number];

// Tier ranking to enforce directionality (starter < pro < business)
const PLAN_RANK: Record<PaidPlan, number> = {
  starter: 1,
  pro: 2,
  business: 3,
};

const VALID_INTERVALS = ["monthly", "yearly"] as const;
type ValidInterval = typeof VALID_INTERVALS[number];

// Authoritative FastSpring product catalog map (never trust client-supplied product path)
const PLAN_PRODUCT_MAP: Record<PaidPlan, Record<ValidInterval, string>> = {
  starter: {
    monthly: "ftchat-starter-monthly",
    yearly: "ftchat-starter-yearly",
  },
  pro: {
    monthly: "ftchat-pro-monthly",
    yearly: "ftchat-pro-yearly",
  },
  business: {
    monthly: "ftchat-business-monthly",
    yearly: "ftchat-business-yearly",
  },
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
    const rawAction = body?.action;

    // Validate action against strict allowlist (prevents typos from triggering accidental cancellations)
    if (!rawAction || typeof rawAction !== "string" || !ALLOWED_ACTIONS.includes(rawAction as AllowedAction)) {
      return new Response(
        JSON.stringify({
          error: `Invalid or missing action '${rawAction}'. Allowed actions: cancel, resume, change-plan (or upgrade/downgrade).`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const action = rawAction as AllowedAction;

    // Fetch current subscription
    const { data: sub, error: subError } = await adminSupabase
      .from("subscriptions")
      .select("payment_subscription_id, payment_provider, status, plan, billing_interval")
      .eq("organization_id", profile.organization_id)
      .maybeSingle();

    if (subError) {
      return new Response(JSON.stringify({ error: "Failed to fetch subscription records" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!sub || sub.plan === "free" || !sub.payment_subscription_id) {
      if (action === "cancel") {
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

      return new Response(
        JSON.stringify({
          error: `Cannot perform '${action}': No active paid FastSpring subscription found to manage. Please subscribe via checkout.`,
          code: "NO_ACTIVE_SUBSCRIPTION",
        }),
        {
          status: 400,
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
    const isCancelAction = action === "cancel";
    const isResumeAction = action === "resume" || action === "uncancel" || action === "reactivate";
    const isChangePlanAction = action === "change-plan" || action === "upgrade" || action === "downgrade";

    // FastSpring Official Subscription API endpoint
    let fsUrl = `https://api.fastspring.com/subscriptions`;
    let fsMethod = "POST";
    let fsBody: string | undefined = undefined;

    if (isChangePlanAction) {
      const targetPlan = body.targetPlan ? String(body.targetPlan).toLowerCase().trim() : "";
      if (!VALID_PAID_PLANS.includes(targetPlan as PaidPlan)) {
        return new Response(
          JSON.stringify({
            error: `Invalid targetPlan '${body.targetPlan}'. Allowed plans: ${VALID_PAID_PLANS.join(", ")}.`,
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Normalize interval (handle both 'yearly' and 'annual')
      let targetInterval = body.billingInterval ? String(body.billingInterval).toLowerCase().trim() : "monthly";
      if (targetInterval === "annual") {
        targetInterval = "yearly";
      }

      if (!VALID_INTERVALS.includes(targetInterval as ValidInterval)) {
        return new Response(
          JSON.stringify({
            error: `Invalid billingInterval '${body.billingInterval}'. Allowed intervals: monthly, yearly.`,
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Verify plan ranking (starter < pro < business) and validate directional actions / no-ops
      const currentPlan = (sub.plan || "").toLowerCase().trim() as PaidPlan;
      const currentRank = PLAN_RANK[currentPlan] ?? 0;
      const targetRank = PLAN_RANK[targetPlan as PaidPlan];

      const rawCurrentInterval = (sub.billing_interval || "").toLowerCase().trim();
      const currentInterval = rawCurrentInterval === "annual" ? "yearly" : rawCurrentInterval;
      const isIntervalChange = Boolean(currentInterval && currentInterval !== targetInterval);

      if (action === "upgrade") {
        if (targetRank < currentRank) {
          return new Response(
            JSON.stringify({
              error: `Cannot upgrade from '${currentPlan}' to '${targetPlan}' because '${targetPlan}' is a lower tier. Use 'downgrade' or 'change-plan' instead.`,
              code: "INVALID_PLAN_DIRECTION",
            }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
        if (targetRank === currentRank && !isIntervalChange) {
          return new Response(
            JSON.stringify({
              error: `Subscription is already on the '${targetPlan}' plan${currentInterval ? ` (${currentInterval})` : ""}. No upgrade required.`,
              code: "NO_PLAN_CHANGE",
            }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
      } else if (action === "downgrade") {
        if (targetRank > currentRank) {
          return new Response(
            JSON.stringify({
              error: `Cannot downgrade from '${currentPlan}' to '${targetPlan}' because '${targetPlan}' is a higher tier. Use 'upgrade' or 'change-plan' instead.`,
              code: "INVALID_PLAN_DIRECTION",
            }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
        if (targetRank === currentRank && !isIntervalChange) {
          return new Response(
            JSON.stringify({
              error: `Subscription is already on the '${targetPlan}' plan${currentInterval ? ` (${currentInterval})` : ""}. No downgrade required.`,
              code: "NO_PLAN_CHANGE",
            }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
      } else if (action === "change-plan") {
        if (targetRank === currentRank && !isIntervalChange) {
          return new Response(
            JSON.stringify({
              error: `Subscription is already on the '${targetPlan}' plan${currentInterval ? ` (${currentInterval})` : ""}. No plan change required.`,
              code: "NO_PLAN_CHANGE",
            }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
      }

      // Derive product exclusively from server-side catalog mapping (disallows arbitrary client product injection)
      const targetProduct = PLAN_PRODUCT_MAP[targetPlan as PaidPlan][targetInterval as ValidInterval];

      // Official FastSpring payload to update subscription product in-place:
      // POST https://api.fastspring.com/subscriptions with { subscriptions: [{ subscription: id, product: path, quantity: 1, prorate: true, deactivation: null }] }
      fsUrl = `https://api.fastspring.com/subscriptions`;
      fsMethod = "POST";
      fsBody = JSON.stringify({
        subscriptions: [
          {
            subscription: sub.payment_subscription_id,
            product: targetProduct,
            quantity: 1,
            prorate: true, // Server-enforced: always prorate plan changes; never trust client-supplied proration flag
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
    } else if (isCancelAction) {
      // Official FastSpring endpoint to cancel subscription at the end of billing period:
      // DELETE https://api.fastspring.com/subscriptions/{subscription_id}?billingPeriod=1
      fsUrl = `https://api.fastspring.com/subscriptions/${sub.payment_subscription_id}?billingPeriod=1`;
      fsMethod = "DELETE";
      fsBody = undefined;
    } else {
      // Defensive fail-closed branch
      return new Response(
        JSON.stringify({ error: `Unsupported subscription action: ${action}` }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
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

      // Downstream FastSpring 401/403 represents third-party merchant credential/permission failure,
      // NOT an invalid or expired end-user Supabase session.
      // Returning 401/403 directly to the frontend causes client-side auth layers to assume the user's
      // app session expired and trigger unnecessary logouts. Map downstream auth/server errors to 502.
      const isDownstreamAuthError = fsResponse.status === 401 || fsResponse.status === 403;
      const clientStatusCode = isDownstreamAuthError
        ? 502
        : fsResponse.status >= 500
        ? 502
        : fsResponse.status;

      return new Response(
        JSON.stringify({
          error: isDownstreamAuthError
            ? `FastSpring gateway authorization failure (${fsResponse.status}): Upstream payment provider rejected merchant API credentials.`
            : `FastSpring API error (${fsResponse.status}): ${errText}`,
          providerStatus: fsResponse.status,
          code: isDownstreamAuthError ? "FASTSPRING_GATEWAY_AUTH_ERROR" : "FASTSPRING_API_ERROR",
        }),
        {
          status: clientStatusCode,
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

    // Note: Database subscription record is NOT updated here directly.
    // As per industry standards, FastSpring will dispatch a signed webhook event
    // (e.g. subscription.updated, subscription.canceled), which is authoritatively processed
    // by the fastspring-webhook Edge Function. The client uses Realtime/short-polling to observe this update.

    let responseMessage = "Operation completed successfully.";
    if (isChangePlanAction) {
      responseMessage = `Subscription ${action === "change-plan" ? "plan change" : action} to ${body.targetPlan} requested. Awaiting FastSpring webhook confirmation.`;
    } else if (isResumeAction) {
      responseMessage = "Subscription auto-renewal request sent to FastSpring. Awaiting FastSpring webhook confirmation.";
    } else if (isCancelAction) {
      responseMessage = "Subscription cancellation request sent to FastSpring. Awaiting FastSpring webhook confirmation.";
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
