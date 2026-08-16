import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardOverviewPage() {
  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold font-display text-neutral-900 dark:text-white">Dashboard Overview</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Monitor your chatbot&apos;s performance and resource limits.</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-lg border border-neutral-200 dark:border-neutral-800 shadow-sm transition-colors">
          <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">Total Chats</p>
          <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mt-2">12</h3>
          <span className="text-[10px] text-neutral-400 dark:text-neutral-500">Current Billing Cycle</span>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-lg border border-neutral-200 dark:border-neutral-800 shadow-sm transition-colors">
          <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">Avg. Confidence</p>
          <h3 className="text-2xl font-bold text-brand-600 dark:text-brand-400 mt-2">92%</h3>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">✓ Optimal Performance</span>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-lg border border-neutral-200 dark:border-neutral-800 shadow-sm transition-colors">
          <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">Active Documents</p>
          <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mt-2">2</h3>
          <span className="text-[10px] text-neutral-400 dark:text-neutral-500">Synced to vector database</span>
        </div>
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-lg border border-neutral-200 dark:border-neutral-800 shadow-sm transition-colors">
          <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">User Satisfaction</p>
          <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mt-2">100%</h3>
          <span className="text-[10px] text-neutral-400 dark:text-neutral-500">Based on user ratings</span>
        </div>
      </div>

      {/* Usage meters and recent activity */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left columns: Usage */}
        <div className="lg:col-span-2 bg-white dark:bg-neutral-900 p-8 rounded-lg border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-6 transition-colors">
          <h3 className="text-base font-semibold text-neutral-900 dark:text-white font-display">Plan Resource Usage</h3>
          
          <div className="space-y-4">
            {/* Meter 1 */}
            <div>
              <div className="flex justify-between text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                <span>Documents Uploaded</span>
                <span>2 / 3 files</span>
              </div>
              <div className="h-2 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div className="h-full bg-brand-500 rounded-full" style={{ width: "66%" }}></div>
              </div>
            </div>

            {/* Meter 2 */}
            <div>
              <div className="flex justify-between text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                <span>Message Volume</span>
                <span>12 / 50 chats</span>
              </div>
              <div className="h-2 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                <div className="h-full bg-brand-500 rounded-full" style={{ width: "24%" }}></div>
              </div>
            </div>
          </div>

          <div className="bg-brand-50 dark:bg-brand-950/50 p-4 rounded-md border border-brand-100 dark:border-brand-800 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-brand-900 dark:text-brand-200">Approaching file limits?</p>
              <p className="text-[10px] text-brand-700 dark:text-brand-300">Upgrade to Pro to crawl URLs and upload up to 50 documents.</p>
            </div>
            <Link href="/dashboard/settings/billing">
              <Button size="sm" className="bg-brand-600 hover:bg-brand-700 text-white text-xs">
                Upgrade Plan
              </Button>
            </Link>
          </div>
        </div>

        {/* Right column: Quick actions */}
        <div className="bg-white dark:bg-neutral-900 p-8 rounded-lg border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col justify-between transition-colors">
          <div>
            <h3 className="text-base font-semibold text-neutral-900 dark:text-white font-display mb-4">Quick Setup</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-6">
              Establish your AI chatbot, sync your custom FAQs, and embed the script in your page.
            </p>
          </div>
          <div className="space-y-3">
            <Link href="/dashboard/documents" className="block">
              <Button variant="outline" className="w-full text-xs justify-start">
                + Upload Knowledge Docs
              </Button>
            </Link>
            <Link href="/dashboard/settings/widget" className="block">
              <Button variant="outline" className="w-full text-xs justify-start">
                ⚙ Configure Embed Widget
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
