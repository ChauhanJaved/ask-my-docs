"use client";

import { Button } from "@/components/ui/button";

export default function WidgetSettingsPage() {
  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold font-display text-neutral-900">Widget Customization</h1>
        <p className="text-sm text-neutral-500">Style your support bot and integrate it with your web app.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Config Form */}
        <div className="bg-white border border-neutral-200 rounded-lg p-6 shadow-sm space-y-6">
          <h3 className="font-semibold text-sm text-neutral-900 font-display border-b pb-4">Widget Settings</h3>
          
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1" htmlFor="botName">
                Chatbot Name
              </label>
              <input
                id="botName"
                type="text"
                defaultValue="AskMyDocs Assistant"
                className="w-full border border-neutral-300 rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1" htmlFor="welcomeMsg">
                Welcome Message
              </label>
              <textarea
                id="welcomeMsg"
                defaultValue="Hi there! How can I help you today?"
                rows={3}
                className="w-full border border-neutral-300 rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Accent Theme Color
              </label>
              <div className="flex space-x-3 mt-1.5">
                <button type="button" className="h-6 w-6 rounded-full bg-brand-500 border-2 border-white ring-2 ring-brand-500"></button>
                <button type="button" className="h-6 w-6 rounded-full bg-teal-500 border border-neutral-300"></button>
                <button type="button" className="h-6 w-6 rounded-full bg-rose-500 border border-neutral-300"></button>
                <button type="button" className="h-6 w-6 rounded-full bg-neutral-900 border border-neutral-300"></button>
              </div>
            </div>

            <Button className="bg-brand-600 hover:bg-brand-700 text-white text-xs px-6">
              Save Customizations
            </Button>
          </form>
        </div>

        {/* Live Code Snippet */}
        <div className="bg-white border border-neutral-200 rounded-lg p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-neutral-900 font-display border-b pb-4">Integration Script</h3>
            <p className="text-xs text-neutral-500">
              Copy and paste this HTML snippet before the closing <code>&lt;/body&gt;</code> tag on your website:
            </p>
            <div className="bg-neutral-900 text-neutral-100 p-4 rounded-md font-mono text-[10px] whitespace-pre-wrap select-all">
              {`<script\n  src="https://widget.askmydocs.com/loader.js"\n  data-org-id="demo-org-12345"\n  defer\n></script>`}
            </div>
          </div>
          <Button variant="outline" className="text-xs mt-6 self-start">
            Copy Script Tag
          </Button>
        </div>
      </div>
    </div>
  );
}
