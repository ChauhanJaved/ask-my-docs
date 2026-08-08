"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function WidgetSettingsPage() {
  const [script, setScript] = useState<string>("");
  const [generating, setGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [widgetUrl, setWidgetUrl] = useState<string>("");

  // In a real app, you'd get orgId from user context
  const mockOrgId = "11111111-1111-1111-1111-111111111111"; // Replace with actual org ID logic

  const handleGenerateScript = async () => {
    setGenerating(true);
    setError("");
    setWidgetUrl("");
    try {
      // Call your widget endpoint to get the script
      const response = await fetch(`/api/widget/embed?orgId=${mockOrgId}`);
      if (!response.ok) {
        throw new Error("Failed to generate widget script");
      }
      const widgetHtml = await response.text();

      // Extract just the script tag for display
      const scriptMatch = widgetHtml.match(/<script[^>]*src="[^"]*"[^>]*><\/script>/);
      if (scriptMatch) {
        setScript(scriptMatch[0]);
        // Extract the URL for the loader script
        const urlMatch = widgetHtml.match(/src="([^"]*)"/);
        if (urlMatch && urlMatch[1]) {
          setWidgetUrl(urlMatch[1]);
        }
      } else {
        setScript("<!-- Could not extract script tag -->");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
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
                defaultValue="FTChat Assistant"
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

            <Button
              className="bg-brand-600 hover:bg-brand-700 text-white text-xs px-6"
              onClick={handleGenerateScript}
              disabled={generating}
            >
              {generating ? "Generating..." : "Generate Embed Script"}
            </Button>
          </form>
        </div>

        {/* Live Code Snippet */}
        <div className="bg-white border border-neutral-200 rounded-lg p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-neutral-900 font-display border-b pb-4">Embed Script</h3>
            <p className="text-xs text-neutral-500">
              Copy and paste this script before the closing <code>&lt;/body&gt;</code> tag on your website:
            </p>
            {error && (
              <div className="bg-rose-50 border-l-4 border-rose-400 text-rose-700 p-4 mb-4">
                <p>{error}</p>
              </div>
            )}
            {script && (
              <div className="bg-neutral-50 p-4 rounded-md font-mono text-[10px] whitespace-pre-wrap">
                {script}
                <Button
                  className="mt-2 text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1"
                  onClick={() => {
                    navigator.clipboard.writeText(script);
                    alert("Script copied to clipboard!");
                  }}
                >
                  Copy to Clipboard
                </Button>

                {widgetUrl && (
                  <div className="mt-2 text-xs text-neutral-500">
                    <p>Widget URL: <code>{widgetUrl}</code></p>
                  </div>
                )}
              </div>
            )}
            {!script && !error && (
              <div className="text-center py-8 text-neutral-500">
                Click &quot;Generate Embed Script&quot; to create your widget code
              </div>
            )}
          </div>
          <Button variant="outline" className="text-xs mt-6 self-start">
            View Documentation
          </Button>
        </div>
      </div>
    </div>
  );
}