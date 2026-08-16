import { Button } from "@/components/ui/button";

export default function BillingSettingsPage() {
  return (
    <div className="space-y-8">
      {/* Title */}
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
          
          <Button className="bg-brand-600 hover:bg-brand-700 text-white text-xs mt-6 self-start">
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
