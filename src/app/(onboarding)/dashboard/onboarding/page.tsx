"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col justify-between p-6 font-sans">
      {/* Header */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between py-4">
        <span className="text-xl font-bold font-display text-brand-600">AskMyDocs</span>
        <span className="text-xs text-neutral-500 font-medium">Setup Wizard</span>
      </header>

      {/* Main Wizard */}
      <main className="max-w-md mx-auto w-full bg-white border border-neutral-200 rounded-lg shadow-sm p-8 my-8">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-brand-600 uppercase">Step 1 of 3</span>
            <span className="text-xs text-neutral-500">Create organization</span>
          </div>
          <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden">
            <div className="h-full bg-brand-500 rounded-full" style={{ width: "33%" }}></div>
          </div>
        </div>

        <h2 className="text-xl font-semibold text-neutral-900 mb-2">Let&apos;s set up your bot</h2>
        <p className="text-sm text-neutral-500 mb-6">
          Provide your company name to get started. You&apos;ll upload your first files next.
        </p>

        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1" htmlFor="orgName">
              Organization/Company Name
            </label>
            <input
              id="orgName"
              type="text"
              placeholder="Acme Corp"
              className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500"
              required
            />
          </div>

          <Link href="/dashboard" className="block pt-2">
            <Button className="w-full bg-brand-600 hover:bg-brand-700 text-white">
              Continue
            </Button>
          </Link>
        </form>
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto w-full text-center text-xs text-neutral-400 py-4">
        <p>© {new Date().getFullYear()} AskMyDocs. All rights reserved.</p>
      </footer>
    </div>
  );
}
