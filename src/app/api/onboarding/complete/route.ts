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

    // 1. Fetch user's profile to check if profile & organization already exist
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .maybeSingle();

    let targetOrgId = profile?.organization_id;

    // 2. If organization doesn't exist yet (e.g. fresh Google OAuth signup), create organization
    if (!targetOrgId) {
      const finalOrgName = orgName?.trim() || `${user.email?.split("@")[0] || "My"}'s Organization`;
      const baseSlug = finalOrgName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "org";
      const uniqueSlug = `${baseSlug}-${user.id.slice(0, 6)}`;

      const { data: newOrg, error: orgInsertError } = await supabase
        .from("organizations")
        .insert({
          name: finalOrgName,
          slug: uniqueSlug,
          plan: "free",
          settings: {
            bot_name: botName || "FTChat Assistant",
            tone: "friendly",
            primary_color: primaryColor || "#6366f1",
            greeting_message: greetingMessage || "Hi! How can I help you today?",
          },
        })
        .select("id")
        .single();

      if (orgInsertError) {
        console.error("Organization creation error:", orgInsertError);
      } else if (newOrg) {
        targetOrgId = newOrg.id;
      }
    } else {
      // If organization exists, update its name and settings
      const updates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (orgName?.trim()) {
        updates.name = orgName.trim();
      }

      const { data: org } = await supabase
        .from("organizations")
        .select("settings")
        .eq("id", targetOrgId)
        .single();

      const currentSettings = (org?.settings as Record<string, unknown>) || {
        bot_name: "FTChat Assistant",
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

      await supabase
        .from("organizations")
        .update(updates)
        .eq("id", targetOrgId);
    }

    // 3. Upsert profile with onboarding_completed = true
    // Using UPSERT ensures that if the profile row was missing for a Google user, it gets created immediately
    if (targetOrgId) {
      const { error: profileUpsertError } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          organization_id: targetOrgId,
          email: user.email ?? "",
          full_name:
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split("@")[0] ||
            "User",
          role: "owner",
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        }, { onConflict: "id" });

      if (profileUpsertError) {
        console.error("Profile upsert error:", profileUpsertError);
      }
    } else {
      // Fallback: update profile if organization ID lookup had issues
      await supabase
        .from("profiles")
        .update({
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);
    }

    return NextResponse.json({ success: true, message: "Onboarding completed successfully" });
  } catch (err) {
    console.error("Error completing onboarding:", err);
    return NextResponse.json({ error: "Failed to complete onboarding" }, { status: 500 });
  }
}
