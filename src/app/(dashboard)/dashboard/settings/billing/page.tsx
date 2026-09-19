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
  isPlanDowngrade,
} from "@/lib/plans";
import { FastSpringScript, openFastSpringCheckout } from "@/components/billing/FastSpringScript";

interface OrgBillingDetails {
  id: string;
  name: string;
  plan: PlanId;
  subscription_status: string;
  payment_provider: string;
  current_period_start?: string | null;
  current_period_end?: string | null;
  cancel_at_period_end?: boolean;
  created_at?: string | null;
  custom_entitlements?: Record<string, unknown>;
  billing_interval?: string | null;
  price_display?: string | null;
  currency?: string | null;
}

interface UsageStats {
  documentsCount: number;
  messagesCount: number;
  teamSeatsCount: number;
}

const NEXT_PLAN_MAP: Record<PlanId, PlanId | null> = {
  free: "starter",
  starter: "pro",
  pro: "business",
  business: null,
};

export default function BillingSettingsPage() {
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [org, setOrg] = useState<OrgBillingDetails | null>(null);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>("monthly");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedDowngradePlan, setSelectedDowngradePlan] = useState<PlanId | null>(null);
  const [downgrading, setDowngrading] = useState<boolean>(false);

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
          .select("id, name")
          .eq("id", profile.organization_id)
          .single();

        const { data: subData } = await supabase
          .from("subscriptions")
          .select(
            "plan, status, payment_provider, current_period_start, current_period_end, cancel_at_period_end, created_at, custom_entitlements, billing_interval, price_display, currency"
          )
          .eq("organization_id", profile.organization_id)
          .maybeSingle();

        if (orgData) {
          setOrg({
            id: orgData.id,
            name: orgData.name,
            plan: (subData?.plan || "free") as PlanId,
            subscription_status: subData?.status || "active",
            payment_provider: subData?.payment_provider || "none",
            current_period_start: subData?.current_period_start,
            current_period_end: subData?.current_period_end,
            cancel_at_period_end: subData?.cancel_at_period_end ?? false,
            created_at: subData?.created_at,
            custom_entitlements: subData?.custom_entitlements,
            billing_interval: subData?.billing_interval,
            price_display: subData?.price_display,
            currency: subData?.currency,
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
    async (data: Record<string, unknown> | null) => {
      console.log("FastSpring popup modal closed with payload:", data);
      if (data && (data.id || data.reference)) {
        setSuccessMessage("🎉 Order completed! Syncing subscription...");
        setTimeout(() => setSuccessMessage(null), 8000);

        // Immediate client fallback sync to ensure DB & UI update even if local webhook tunnel is offline
        try {
          const supabase = createBrowserSupabaseClient();
          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (user) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("organization_id")
              .eq("id", user.id)
              .single();

            if (profile?.organization_id) {
              const now = new Date();
              const nextMonth = new Date(now);
              nextMonth.setMonth(nextMonth.getMonth() + 1);

              await supabase.from("subscriptions").upsert(
                {
                  organization_id: profile.organization_id,
                  payment_provider: "fastspring",
                  status: "active",
                  current_period_start: now.toISOString(),
                  current_period_end: nextMonth.toISOString(),
                  updated_at: now.toISOString(),
                },
                { onConflict: "organization_id" }
              );
            }
          }
        } catch (err) {
          console.error("Error in client-side payment sync fallback:", err);
        }

        setTimeout(() => {
          loadBillingData();
        }, 1000);
      } else {
        loadBillingData();
      }
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
  const nextPlanId = NEXT_PLAN_MAP[org?.plan || "free"];

  const calculatePercentage = (used: number, limit: number) => {
    if (limit === -1) return 0;
    if (limit === 0) return 100;
    return Math.min(Math.round((used / limit) * 100), 100);
  };

  const getProgressBarColor = (used: number, limit: number) => {
    if (limit === -1) return "bg-brand-500";
    const pct = (used / limit) * 100;
    if (pct >= 100) return "bg-rose-500";
    if (pct >= 80) return "bg-amber-500";
    return "bg-brand-500";
  };

  const handleUpgrade = (planId: PlanId) => {
    if (!org) return;
    const productId = `ftchat-${planId}-${billingInterval}`;
    openFastSpringCheckout(productId, org.id);
  };

  const handleConfirmDowngrade = async () => {
    if (!org || !selectedDowngradePlan) return;
    setDowngrading(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const isFree = selectedDowngradePlan === "free";

      const { error } = await supabase
        .from("subscriptions")
        .update({
          plan: selectedDowngradePlan,
          status: isFree ? "active" : org.subscription_status,
          payment_provider: isFree ? "none" : org.payment_provider,
          cancel_at_period_end: isFree ? false : org.cancel_at_period_end,
          updated_at: new Date().toISOString(),
        })
        .eq("organization_id", org.id);

      if (error) {
        console.error("Error performing plan downgrade:", error);
        alert("Failed to downgrade plan. Please try again or contact support.");
      } else {
        const targetName = PLAN_DEFINITIONS[selectedDowngradePlan].name;
        setSuccessMessage(
          isFree
            ? "Workspace successfully switched to the Free Plan."
            : `Workspace plan updated to ${targetName}.`
        );
        setTimeout(() => setSuccessMessage(null), 8000);
        setSelectedDowngradePlan(null);
        await loadBillingData();
      }
    } catch (err) {
      console.error("Error during plan downgrade:", err);
    } finally {
      setDowngrading(false);
    }
  };

  // Quota checks
  const isDocsExceeded = entitlements.quotas.max_documents !== -1 && usage.documentsCount > entitlements.quotas.max_documents;
  const isSeatsExceeded = entitlements.quotas.team_seats !== -1 && usage.teamSeatsCount > entitlements.quotas.team_seats;
  const isMessagesExceeded = entitlements.quotas.monthly_messages !== -1 && usage.messagesCount > entitlements.quotas.monthly_messages;
  const isAnyQuotaExceeded = isDocsExceeded || isSeatsExceeded || isMessagesExceeded;

  const targetDowngradePlan = selectedDowngradePlan ? PLAN_DEFINITIONS[selectedDowngradePlan] : null;

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="max-w-5xl space-y-8 pb-16">
      <FastSpringScript onPopupClosed={handlePopupClosed} />

      {/* Success Notification */}
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

      {/* Quota Overage Warning Banner */}
      {isAnyQuotaExceeded && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 p-4 rounded-2xl text-xs font-medium space-y-1">
          <div className="flex items-center space-x-2 font-bold text-amber-700 dark:text-amber-400">
            <span className="text-base">⚠️</span>
            <span>Usage Limit Alert</span>
          </div>
          <p className="leading-relaxed">
            Your workspace has exceeded limits on your active plan (
            {isDocsExceeded && `Documents: ${usage.documentsCount}/${entitlements.quotas.max_documents} `}
            {isSeatsExceeded && `Seats: ${usage.teamSeatsCount}/${entitlements.quotas.team_seats} `}
            {isMessagesExceeded && `Messages: ${usage.messagesCount}/${entitlements.quotas.monthly_messages}`}
            ). Please delete unused items or upgrade to restore unrestricted access.
          </p>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold font-display text-neutral-900 dark:text-white">
          Billing & Subscription Plan
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Complete transparency on workspace subscriptions, usage quotas, renewal dates, and plan management.
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
                <h2 className="text-2xl font-extrabold text-neutral-900 dark:text-white font-display mt-0.5 flex items-center gap-2">
                  <span>{currentPlan.name}</span>
                  {org?.billing_interval && org?.plan !== "free" && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20 capitalize">
                      {org.billing_interval}
                    </span>
                  )}
                </h2>
                {org?.plan && org?.plan !== "free" && (
                  <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200 mt-1">
                    ${org.billing_interval === "yearly" ? currentPlan.priceYearly : currentPlan.priceMonthly}{" "}
                    <span className="text-xs font-normal text-neutral-500">
                      / {org.billing_interval === "yearly" ? "year" : "month"}
                    </span>
                  </p>
                )}
              </div>
              <span
                className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border capitalize ${
                  org?.subscription_status === "active"
                    ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                    : org?.subscription_status === "canceled"
                    ? "bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800"
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
                <span className="font-medium capitalize">
                  {org?.payment_provider !== "none" ? org?.payment_provider : "None (Free Tier)"}
                </span>
              </div>
              {org?.billing_interval && org?.plan !== "free" && (
                <div className="flex justify-between">
                  <span className="text-neutral-400">Billing Cycle:</span>
                  <span className="font-medium capitalize">
                    {org.billing_interval}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-neutral-400">Plan Start Date:</span>
                <span className="font-medium">
                  {formatDate(org?.current_period_start || org?.created_at)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Next Payment / Renewal:</span>
                <span className="font-medium font-semibold text-brand-600 dark:text-brand-400">
                  {org?.plan === "free" ? "N/A (Free Plan)" : formatDate(org?.current_period_end)}
                </span>
              </div>
              {org?.cancel_at_period_end && (
                <div className="flex justify-between text-rose-600 dark:text-rose-400 font-medium">
                  <span>Auto-Renewal:</span>
                  <span>Cancels on {formatDate(org?.current_period_end)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3 pt-2">
            {nextPlanId && (
              <Button
                onClick={() => {
                  document.getElementById(`plan-card-${nextPlanId}`)?.scrollIntoView({ behavior: "smooth" });
                }}
                className="bg-brand-600 hover:bg-brand-700 text-white text-xs rounded-xl py-2.5 px-4 font-semibold shadow-md transition-all"
              >
                Upgrade Plan
              </Button>
            )}
          </div>
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
                <span className={isMessagesExceeded ? "text-rose-600 dark:text-rose-400 font-bold" : ""}>
                  {usage.messagesCount.toLocaleString()} /{" "}
                  {entitlements.quotas.monthly_messages === -1
                    ? "Unlimited"
                    : entitlements.quotas.monthly_messages.toLocaleString()}
                </span>
              </div>
              <div className="h-2 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${getProgressBarColor(
                    usage.messagesCount,
                    entitlements.quotas.monthly_messages
                  )}`}
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
                <span className={isDocsExceeded ? "text-rose-600 dark:text-rose-400 font-bold" : ""}>
                  {usage.documentsCount.toLocaleString()} /{" "}
                  {entitlements.quotas.max_documents === -1
                    ? "Unlimited"
                    : entitlements.quotas.max_documents.toLocaleString()}
                </span>
              </div>
              <div className="h-2 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${getProgressBarColor(
                    usage.documentsCount,
                    entitlements.quotas.max_documents
                  )}`}
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
                <span className={isSeatsExceeded ? "text-rose-600 dark:text-rose-400 font-bold" : ""}>
                  {usage.teamSeatsCount.toLocaleString()} /{" "}
                  {entitlements.quotas.team_seats === -1
                    ? "Unlimited"
                    : entitlements.quotas.team_seats.toLocaleString()}
                </span>
              </div>
              <div className="h-2 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${getProgressBarColor(
                    usage.teamSeatsCount,
                    entitlements.quotas.team_seats
                  )}`}
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

      {/* Available Subscription Plans Section */}
      <div id="available-plans" className="pt-6 space-y-6 scroll-mt-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-4">
          <div>
            <h2 className="text-xl font-bold font-display text-neutral-900 dark:text-white">
              Available Subscription Plans
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Upgrade or downgrade your plan to fit your workspace size and AI workload.
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

        {/* Plan Cards Grid (Free, Starter, Pro, Business) */}
        <div className="grid md:grid-cols-4 gap-4">
          {(["free", "starter", "pro", "business"] as PlanId[]).map((planId) => {
            const plan = PLAN_DEFINITIONS[planId];
            const isCurrent = org?.plan === planId;
            const isDowngrade = isPlanDowngrade(org?.plan, planId);
            const price = billingInterval === "yearly" ? Math.round(plan.priceYearly / 12) : plan.priceMonthly;

            return (
              <div
                key={planId}
                id={`plan-card-${planId}`}
                className={`bg-white dark:bg-neutral-900 border rounded-2xl p-5 shadow-sm flex flex-col justify-between relative transition-all scroll-mt-24 ${
                  isCurrent
                    ? "border-brand-500 dark:border-brand-500 ring-2 ring-brand-500/20"
                    : plan.badge
                    ? "border-brand-400/50 dark:border-brand-500/40"
                    : "border-neutral-200 dark:border-neutral-800"
                }`}
              >
                {plan.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-sm">
                    {plan.badge}
                  </span>
                )}

                <div>
                  <h3 className="text-base font-bold text-neutral-900 dark:text-white font-display">
                    {plan.name}
                  </h3>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 min-h-[36px] leading-tight">
                    {plan.description}
                  </p>

                  <div className="mt-3 mb-5">
                    <span className="text-2xl font-extrabold text-neutral-900 dark:text-white font-display">
                      ${price}
                    </span>
                    <span className="text-xs text-neutral-400 font-medium">/month</span>
                    {billingInterval === "yearly" && planId !== "free" && (
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                        Billed annually (${plan.priceYearly}/yr)
                      </p>
                    )}
                  </div>

                  <ul className="space-y-2 text-[11px] text-neutral-600 dark:text-neutral-300 border-t border-neutral-100 dark:border-neutral-800 pt-3 mb-5">
                    {plan.featureHighlights.map((highlight, idx) => (
                      <li key={idx} className="flex items-start space-x-1.5">
                        <span className="text-brand-500 font-bold shrink-0">✓</span>
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Button
                  onClick={() => {
                    if (isCurrent) return;
                    if (isDowngrade) {
                      setSelectedDowngradePlan(planId);
                    } else {
                      handleUpgrade(planId);
                    }
                  }}
                  disabled={isCurrent}
                  className={`w-full text-xs py-2 rounded-xl font-semibold transition-all ${
                    isCurrent
                      ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed border border-neutral-200 dark:border-neutral-700"
                      : isDowngrade
                      ? "bg-transparent border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                      : plan.badge
                      ? "bg-brand-600 hover:bg-brand-700 text-white shadow-md"
                      : "bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-neutral-100 dark:hover:bg-white dark:text-neutral-900"
                  }`}
                >
                  {isCurrent
                    ? "Current Active Plan"
                    : isDowngrade
                    ? `Downgrade to ${plan.name}`
                    : `Upgrade to ${plan.name}`}
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Plan Downgrade Confirmation Modal */}
      {selectedDowngradePlan && targetDowngradePlan && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex justify-between items-start border-b border-neutral-100 dark:border-neutral-800 pb-3">
              <div>
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  Confirm Plan Downgrade
                </span>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white font-display">
                  Switch to {targetDowngradePlan.name} Plan
                </h3>
              </div>
              <button
                onClick={() => setSelectedDowngradePlan(null)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-neutral-600 dark:text-neutral-300">
              <p>
                You are about to downgrade your workspace plan from <strong>{currentPlan.name}</strong> to{" "}
                <strong>{targetDowngradePlan.name}</strong>.
              </p>

              <div className="bg-neutral-50 dark:bg-neutral-800/60 p-3 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-1.5">
                <span className="font-semibold text-neutral-900 dark:text-white">
                  New Quota Limits:
                </span>
                <ul className="list-disc list-inside space-y-1 text-neutral-500 dark:text-neutral-400">
                  <li>
                    AI Messages:{" "}
                    {targetDowngradePlan.quotas.monthly_messages === -1
                      ? "Unlimited"
                      : `${targetDowngradePlan.quotas.monthly_messages.toLocaleString()} / mo`}
                  </li>
                  <li>
                    Knowledge Documents:{" "}
                    {targetDowngradePlan.quotas.max_documents === -1
                      ? "Unlimited"
                      : targetDowngradePlan.quotas.max_documents}
                  </li>
                  <li>Team Seats: {targetDowngradePlan.quotas.team_seats}</li>
                </ul>
              </div>

              {/* Warning if current usage will exceed target plan limit */}
              {(targetDowngradePlan.quotas.max_documents !== -1 &&
                usage.documentsCount > targetDowngradePlan.quotas.max_documents) ||
              (targetDowngradePlan.quotas.team_seats !== -1 &&
                usage.teamSeatsCount > targetDowngradePlan.quotas.team_seats) ? (
                <div className="bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 p-3 rounded-xl space-y-1">
                  <span className="font-bold flex items-center gap-1">
                    ⚠️ Current Usage Exceeds Limits
                  </span>
                  <p className="leading-relaxed">
                    Your workspace currently has {usage.documentsCount} document(s) and {usage.teamSeatsCount} team seat(s).
                    Excess data won&apos;t be deleted automatically, but you won&apos;t be able to add new items until usage is reduced.
                  </p>
                </div>
              ) : null}
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setSelectedDowngradePlan(null)}
                disabled={downgrading}
                className="text-xs rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmDowngrade}
                disabled={downgrading}
                className="bg-amber-600 hover:bg-amber-700 text-white text-xs rounded-xl px-5 font-semibold"
              >
                {downgrading ? "Downgrading..." : `Confirm Downgrade to ${targetDowngradePlan.name}`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
