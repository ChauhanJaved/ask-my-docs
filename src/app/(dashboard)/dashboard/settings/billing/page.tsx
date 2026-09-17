"use client";

import { Button } from "@/components/ui/button";
import { useState, useEffect, useCallback } from "react";
import { createBrowserSupabaseClient } from "@/utils/supabase/client";
import { canManageBilling, UserRole } from "@/lib/permissions";
import { DashboardPageSkeleton } from "@/components/ui/page-loader";
import {
  PLAN_DEFINITIONS,
  PlanId,
  getOrgEntitlements,
  BillingInterval,
} from "@/lib/plans";
import { FastSpringScript, openFastSpringCheckout } from "@/components/billing/FastSpringScript";

interface OrgBillingDetails {
  id: string;
  name: string;
  plan: PlanId;
  subscription_status: string;
  payment_provider: string;
  current_period_end?: string | null;
  custom_entitlements?: Record<string, unknown>;
}

interface UsageStats {
  documentsCount: number;
  messagesCount: number;
  teamSeatsCount: number;
}

export default function BillingSettingsPage() {
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [org, setOrg] = useState<OrgBillingDetails | null>(null);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>("monthly");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [usage, setUsage] = useState<UsageStats>({
    documentsCount: 0,
    messagesCount: 0,
    teamSeatsCount: 0,
  });

  const loadBillingData = useCallback(async () => {
    try {
      const supabase = createBrowserSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, organization_id")
        .eq("id", user.id)
        .single();

      if (profile) {
        setRole(profile.role as UserRole);

        const { data: orgData } = await supabase
          .from("organizations")
          .select("id, name, plan, subscription_status, payment_provider, current_period_end, custom_entitlements")
          .eq("id", profile.organization_id)
          .single();

        if (orgData) {
          setOrg({
            ...orgData,
            plan: (orgData.plan || "free") as PlanId,
          });

          const [docsRes, seatsRes, messagesRes] = await Promise.all([
            supabase
              .from("documents")
              .select("id", { count: "exact", head: true })
              .eq("organization_id", orgData.id),
            supabase
              .from("profiles")
              .select("id", { count: "exact", head: true })
              .eq("organization_id", orgData.id),
            supabase
              .from("chat_messages")
              .select("id", { count: "exact", head: true })
              .eq("organization_id", orgData.id),
          ]);

          setUsage({
            documentsCount: docsRes.count || 0,
            teamSeatsCount: seatsRes.count || 0,
            messagesCount: messagesRes.count || 0,
          });
        }
      }
    } catch (err) {
      console.error("Error loading billing details:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBillingData();
  }, [loadBillingData]);

  const handlePopupClosed = useCallback(
    (data: Record<string, unknown> | null) => {
      console.log("FastSpring popup modal closed with payload:", data);
      if (data && (data.id || data.reference)) {
        setSuccessMessage("🎉 Order completed! Your subscription is updating...");
        setTimeout(() => setSuccessMessage(null), 8000);
      }
      // Re-fetch org data to reflect any webhook update
      loadBillingData();
    },
    [loadBillingData]
  );

  const isOwner = canManageBilling(role);

  if (loading) {
    return <DashboardPageSkeleton title={true} statCards={3} tableRows={2} />;
  }

  if (!isOwner) {
    return (
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-8 shadow-sm text-center max-w-lg mx-auto my-12 space-y-4">
        <div className="h-12 w-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto text-xl font-bold">
          🔒
        </div>
        <h2 className="text-xl font-bold font-display text-neutral-900 dark:text-white">
          Access Restricted
        </h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
          Only workspace <strong>Owners</strong> can view or manage billing, subscription plans, and invoices. You are currently logged in as a <strong className="capitalize text-neutral-700 dark:text-neutral-300">{role || "Member"}</strong>.
        </p>
        <div className="pt-2">
          <Button
            onClick={() => (window.location.href = "/dashboard")}
            className="bg-brand-600 hover:bg-brand-700 text-white text-xs px-6 rounded-xl"
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const currentPlan = PLAN_DEFINITIONS[org?.plan || "free"];
  const entitlements = getOrgEntitlements(org?.plan, org?.custom_entitlements);

  const calculatePercentage = (used: number, limit: number) => {
    if (limit === -1) return 0;
    if (limit === 0) return 100;
    return Math.min(Math.round((used / limit) * 100), 100);
  };

  const handleUpgrade = (planId: PlanId) => {
    if (!org) return;
    const productId = `ftchat-${planId}-${billingInterval}`;
    openFastSpringCheckout(productId, org.id);
  };

  return (
    <div className="max-w-5xl space-y-8 pb-16">
      <FastSpringScript onPopupClosed={handlePopupClosed} />

      {successMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 p-4 rounded-xl text-xs font-semibold flex items-center justify-between animate-fade-in">
          <span>{successMessage}</span>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-500 hover:text-emerald-700 font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold font-display text-neutral-900 dark:text-white">
          Billing & Subscription Plan
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Manage your workspace subscription tier, usage quotas, and FastSpring payment settings.
        </p>
      </div>

      {/* Active Subscription & Quota Usage Grid */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Active plan card */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm space-y-6 flex flex-col justify-between transition-colors">
          <div>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
                  Current Workspace Plan
                </span>
                <h2 className="text-2xl font-extrabold text-neutral-900 dark:text-white font-display mt-0.5">
                  {currentPlan.name}
                </h2>
              </div>
              <span
                className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border capitalize ${
                  org?.subscription_status === "active"
                    ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                    : "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                }`}
              >
                {org?.subscription_status || "Active"}
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
              {currentPlan.description}
            </p>

            <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800 space-y-2 text-xs text-neutral-600 dark:text-neutral-300">
              <div className="flex justify-between">
                <span className="text-neutral-400">Payment Gateway:</span>
                <span className="font-medium capitalize">{org?.payment_provider !== 'none' ? org?.payment_provider : 'None (Free Tier)'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Renewal Date:</span>
                <span className="font-medium">
                  {org?.current_period_end
                    ? new Date(org.current_period_end).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "N/A (Free Plan)"}
                </span>
              </div>
            </div>
          </div>

          {org?.plan !== "business" && (
            <Button
              onClick={() => handleUpgrade("pro")}
              className="bg-brand-600 hover:bg-brand-700 text-white text-xs rounded-xl py-2.5 px-4 font-semibold shadow-md transition-all self-start"
            >
              Upgrade to Pro ($79/mo)
            </Button>
          )}
        </div>

        {/* Live Quota Usage Breakdown */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-sm space-y-5 transition-colors">
          <h3 className="font-bold text-sm text-neutral-900 dark:text-white font-display border-b border-neutral-100 dark:border-neutral-800 pb-3">
            Current Quota Usage
          </h3>

          <div className="space-y-4 text-xs">
            {/* Monthly Messages */}
            <div>
              <div className="flex justify-between font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                <span>Monthly AI Messages</span>
                <span>
                  {usage.messagesCount.toLocaleString()} /{" "}
                  {entitlements.quotas.monthly_messages === -1
                    ? "Unlimited"
                    : entitlements.quotas.monthly_messages.toLocaleString()}
                </span>
              </div>
              <div className="h-2 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${calculatePercentage(
                      usage.messagesCount,
                      entitlements.quotas.monthly_messages
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* Documents */}
            <div>
              <div className="flex justify-between font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                <span>Knowledge Documents</span>
                <span>
                  {usage.documentsCount.toLocaleString()} /{" "}
                  {entitlements.quotas.max_documents === -1
                    ? "Unlimited"
                    : entitlements.quotas.max_documents.toLocaleString()}
                </span>
              </div>
              <div className="h-2 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${calculatePercentage(
                      usage.documentsCount,
                      entitlements.quotas.max_documents
                    )}%`,
                  }}
                />
              </div>
            </div>

            {/* Team Seats */}
            <div>
              <div className="flex justify-between font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                <span>Team Seats</span>
                <span>
                  {usage.teamSeatsCount.toLocaleString()} /{" "}
                  {entitlements.quotas.team_seats === -1
                    ? "Unlimited"
                    : entitlements.quotas.team_seats.toLocaleString()}
                </span>
              </div>
              <div className="h-2 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${calculatePercentage(
                      usage.teamSeatsCount,
                      entitlements.quotas.team_seats
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Available Upgrade Plans Section */}
      <div className="pt-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-4">
          <div>
            <h2 className="text-xl font-bold font-display text-neutral-900 dark:text-white">
              Available Subscription Plans
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Upgrade your plan via FastSpring to unlock extra AI capabilities and team seats.
            </p>
          </div>

          {/* Monthly / Yearly Toggle */}
          <div className="flex items-center space-x-2 bg-neutral-100 dark:bg-neutral-800/80 p-1 rounded-xl border border-neutral-200 dark:border-neutral-700 self-start">
            <button
              onClick={() => setBillingInterval("monthly")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                billingInterval === "monthly"
                  ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm"
                  : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingInterval("yearly")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center space-x-1 ${
                billingInterval === "yearly"
                  ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-sm"
                  : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              <span>Yearly Billing</span>
              <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                Save ~20%
              </span>
            </button>
          </div>
        </div>

        {/* Plan Cards Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {(["starter", "pro", "business"] as PlanId[]).map((planId) => {
            const plan = PLAN_DEFINITIONS[planId];
            const isCurrent = org?.plan === planId;
            const price = billingInterval === "yearly" ? Math.round(plan.priceYearly / 12) : plan.priceMonthly;

            return (
              <div
                key={planId}
                className={`bg-white dark:bg-neutral-900 border rounded-2xl p-6 shadow-sm flex flex-col justify-between relative transition-all ${
                  plan.badge
                    ? "border-brand-500 dark:border-brand-500 ring-1 ring-brand-500/20"
                    : "border-neutral-200 dark:border-neutral-800"
                }`}
              >
                {plan.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-sm">
                    {plan.badge}
                  </span>
                )}

                <div>
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-white font-display">
                    {plan.name}
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 min-h-[32px]">
                    {plan.description}
                  </p>

                  <div className="mt-4 mb-6">
                    <span className="text-3xl font-extrabold text-neutral-900 dark:text-white font-display">
                      ${price}
                    </span>
                    <span className="text-xs text-neutral-400 font-medium">/month</span>
                    {billingInterval === "yearly" && (
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                        Billed annually (${plan.priceYearly}/yr)
                      </p>
                    )}
                  </div>

                  <ul className="space-y-2.5 text-xs text-neutral-600 dark:text-neutral-300 border-t border-neutral-100 dark:border-neutral-800 pt-4 mb-6">
                    {plan.featureHighlights.map((highlight, idx) => (
                      <li key={idx} className="flex items-center space-x-2">
                        <span className="text-brand-500 font-bold">✓</span>
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Button
                  onClick={() => handleUpgrade(planId)}
                  disabled={isCurrent}
                  className={`w-full text-xs py-2.5 rounded-xl font-semibold transition-all ${
                    isCurrent
                      ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed border border-neutral-200 dark:border-neutral-700"
                      : plan.badge
                      ? "bg-brand-600 hover:bg-brand-700 text-white shadow-md"
                      : "bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-100 dark:hover:bg-white dark:text-neutral-900"
                  }`}
                >
                  {isCurrent ? "Current Active Plan" : `Upgrade to ${plan.name}`}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
