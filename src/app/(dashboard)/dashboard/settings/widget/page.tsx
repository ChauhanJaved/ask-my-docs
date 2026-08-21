"use client";

import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { createBrowserSupabaseClient } from "@/utils/supabase/client";
import { canManageBotSettings, UserRole } from "@/lib/permissions";

export default function WidgetSettingsPage() {
  const [script, setScript] = useState<string>("");
  const [generating, setGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [widgetUrl, setWidgetUrl] = useState<string>("");
  const [role, setRole] = useState<UserRole | null>(null);

  useEffect(() => {
    async function fetchRole() {
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
        console.error("Error fetching user role for widget settings:", err);
      }
    }
    fetchRole();
  }, []);

  const canEditSettings = canManageBotSettings(role);

  // In a real app, you'd get orgId from user context
  const mockOrgId = "11111111-1111-1111-1111-111111111111";

  const handleGenerateScript = async () => {
    setGenerating(true);
    setError("");
    setWidgetUrl("");
    try {
      const response = await fetch(`/api/widget/embed?orgId=${mockOrgId}`);
      if (!response.ok) {
        throw new Error("Failed to generate widget script");
      }
      const widgetHtml = await response.text();

      const scriptMatch = widgetHtml.match(/<script[^>]*src="[^"]*"[^>]*><\/script>/);
      if (scriptMatch) {
        setScript(scriptMatch[0]);
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
        <h1 className="text-2xl font-bold font-display text-neutral-900 dark:text-white">Widget Customization</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Style your support bot and integrate it with your web app.</p>
      </div>

      {role === "member" && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border-l-4 border-amber-500 p-4 rounded-r-md text-xs text-amber-800 dark:text-amber-300">
          ℹ️ You are logged in as a <strong>Member</strong>. Only workspace Owners and Admins can change global chatbot settings and branding. You can still generate and copy the embed script below.
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Config Form */}
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-6 shadow-sm space-y-6 transition-colors">
          <h3 className="font-semibold text-sm text-neutral-900 dark:text-white font-display border-b border-neutral-200 dark:border-neutral-800 pb-4">Widget Settings</h3>

          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1" htmlFor="botName">
                Chatbot Name
              </label>
              <input
                id="botName"
                type="text"
                defaultValue="FTChat Assistant"
                disabled={!canEditSettings}
                className="w-full bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1" htmlFor="welcomeMsg">
                Welcome Message
              </label>
              <textarea
                id="welcomeMsg"
                defaultValue="Hi there! How can I help you today?"
                rows={3}
                disabled={!canEditSettings}
                className="w-full bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 rounded-md px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Accent Theme Color
              </label>
              <div className="flex space-x-3 mt-1.5">
                <button type="button" disabled={!canEditSettings} className="h-6 w-6 rounded-full bg-brand-500 border-2 border-white ring-2 ring-brand-500 disabled:opacity-60"></button>
                <button type="button" disabled={!canEditSettings} className="h-6 w-6 rounded-full bg-teal-500 border border-neutral-300 dark:border-neutral-700 disabled:opacity-60"></button>
                <button type="button" disabled={!canEditSettings} className="h-6 w-6 rounded-full bg-rose-500 border border-neutral-300 dark:border-neutral-700 disabled:opacity-60"></button>
                <button type="button" disabled={!canEditSettings} className="h-6 w-6 rounded-full bg-neutral-900 dark:bg-neutral-100 border border-neutral-300 dark:border-neutral-700 disabled:opacity-60"></button>
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
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-6 shadow-sm flex flex-col justify-between transition-colors">
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-neutral-900 dark:text-white font-display border-b border-neutral-200 dark:border-neutral-800 pb-4">Embed Script</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Copy and paste this script before the closing <code>&lt;/body&gt;</code> tag on your website:
            </p>
            {error && (
              <div className="bg-rose-50 dark:bg-rose-950/50 border-l-4 border-rose-400 dark:border-rose-600 text-rose-700 dark:text-rose-300 p-4 mb-4">
                <p>{error}</p>
              </div>
            )}
            {script && (
              <div className="bg-neutral-50 dark:bg-neutral-950 p-4 rounded-md font-mono text-[10px] whitespace-pre-wrap text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-800">
                {script}
                <Button
                  className="mt-2 text-xs bg-brand-600 hover:bg-brand-700 text-white px-3 py-1 block"
                  onClick={() => {
                    navigator.clipboard.writeText(script);
                    alert("Script copied to clipboard!");
                  }}
                >
                  Copy to Clipboard
                </Button>

                {widgetUrl && (
                  <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                    <p>Widget URL: <code>{widgetUrl}</code></p>
                  </div>
                )}
              </div>
            )}
            {!script && !error && (
              <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
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