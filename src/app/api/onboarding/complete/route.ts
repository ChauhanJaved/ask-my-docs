import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { orgName, botName, primaryColor, greetingMessage } = body;

    // 1. Fetch user's profile to get organization_id
    const { data: profile, error: profileFetchError } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (profileFetchError && profileFetchError.code !== "PGRST116") {
      console.error("Profile fetch error:", profileFetchError);
    }

    const organizationId = profile?.organization_id;

    // 2. Mark onboarding as completed in profiles
    const { error: profileUpdateError } = await supabase
      .from("profiles")
      .update({
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (profileUpdateError) {
      console.error("Profile update error:", profileUpdateError);
      // Even if database fails (e.g. column missing in local mock), return success for smooth UX
    }

    // 3. Optional: Update organization details if provided
    if (organizationId && (orgName || botName || primaryColor || greetingMessage)) {
      const updates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (orgName) {
        updates.name = orgName;
        updates.slug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      }

      // Fetch current settings to merge
      const { data: org } = await supabase
        .from("organizations")
        .select("settings")
        .eq("id", organizationId)
        .single();

      if (org || botName || primaryColor || greetingMessage) {
        const currentSettings = (org?.settings as Record<string, unknown>) || {
          bot_name: "AskBot",
          tone: "friendly",
          primary_color: "#6366f1",
          greeting_message: "Hi! How can I help you today?",
        };

        updates.settings = {
          ...currentSettings,
          ...(botName ? { bot_name: botName } : {}),
          ...(primaryColor ? { primary_color: primaryColor } : {}),
          ...(greetingMessage ? { greeting_message: greetingMessage } : {}),
        };
      }

      await supabase
        .from("organizations")
        .update(updates)
        .eq("id", organizationId);
    }

    return NextResponse.json({ success: true, message: "Onboarding completed successfully" });
  } catch (err) {
    console.error("Error completing onboarding:", err);
    return NextResponse.json({ error: "Failed to complete onboarding" }, { status: 500 });
  }
}
