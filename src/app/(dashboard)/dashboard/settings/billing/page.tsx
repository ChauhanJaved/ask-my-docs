"use client";

import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { createBrowserSupabaseClient } from "@/utils/supabase/client";
import { canManageBilling, UserRole } from "@/lib/permissions";

export default function BillingSettingsPage() {
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchUserRole() {
      try {
        const supabase = createBrowserSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single();

          if (profile) {
            setRole(profile.role as UserRole);
          }
        }
      } catch (err) {
        console.error("Error fetching user role for billing:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchUserRole();
  }, []);

  const isOwner = canManageBilling(role);

  if (loading) {
    return <div className="text-center py-12 text-neutral-500 dark:text-neutral-400 font-medium">Loading billing details...</div>;
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
          Only workspace <strong>Owners</strong> can view or manage billing, subscription plans, and invoices. You are currently logged in as an <strong className="capitalize text-neutral-700 dark:text-neutral-300">{role || "Member"}</strong>.
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold font-display text-neutral-900 dark:text-white">Billing & Quota Plan</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">View current plan parameters, usage caps, and invoices.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Active plan card */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-6 shadow-sm space-y-6 flex flex-col justify-between transition-colors">
          <div>
            <h3 className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-2">Current Active Subscription</h3>
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-extrabold text-neutral-900 dark:text-white font-display">Free Trial Plan</h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Free tier for prototyping AI bots</p>
              </div>
              <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                Active
              </span>
            </div>
            <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800">
              Next billing date: <strong>None (Free Plan)</strong>
            </p>
          </div>
          
          <Button
            className="bg-brand-600 hover:bg-brand-700 text-white text-xs mt-6 self-start"
            title="Upgrade your workspace plan"
          >
            Upgrade to Pro ($49/mo)
          </Button>
        </div>

        {/* Quota breakdown */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-6 shadow-sm space-y-4 transition-colors">
          <h3 className="font-semibold text-sm text-neutral-900 dark:text-white font-display border-b border-neutral-200 dark:border-neutral-800 pb-4">Usage Quotas</h3>
          
          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                <span>Monthly AI Chats</span>
                <span>12 / 50 chats (24%)</span>
              </div>
              <div className="h-1.5 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div className="h-full bg-brand-500 rounded-full" style={{ width: "24%" }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                <span>Uploaded Documents</span>
                <span>2 / 3 files (66%)</span>
              </div>
              <div className="h-1.5 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div className="h-full bg-brand-500 rounded-full" style={{ width: "66%" }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
