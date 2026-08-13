import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function POST(request: Request) {
  try {
    // 1. Authenticate user session using standard server client
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { orgName, botName, primaryColor, greetingMessage } = body;

    // 2. Use admin client to perform database updates cleanly bypassing RLS lockouts
    const adminSupabase = createAdminClient();

    // Check if user already has a profile & organization
    const { data: profile } = await adminSupabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .maybeSingle();

    let targetOrgId = profile?.organization_id;

    // 3. Create or update Organization
    if (!targetOrgId) {
      const finalOrgName = orgName?.trim() || `${user.email?.split("@")[0] || "My"}'s Organization`;
      const baseSlug = finalOrgName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "org";
      const uniqueSlug = `${baseSlug}-${user.id.slice(0, 6)}`;

      const { data: newOrg, error: orgError } = await adminSupabase
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

      if (orgError) {
        console.error("Organization creation error:", orgError);
      } else if (newOrg) {
        targetOrgId = newOrg.id;
      }
    } else {
      // Update existing organization settings
      const updates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (orgName?.trim()) {
        updates.name = orgName.trim();
      }

      const { data: org } = await adminSupabase
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

      await adminSupabase
        .from("organizations")
        .update(updates)
        .eq("id", targetOrgId);
    }

    // 4. Upsert profile record setting onboarding_completed = true
    if (targetOrgId) {
      const { error: profileError } = await adminSupabase
        .from("profiles")
        .upsert(
          {
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
          },
          { onConflict: "id" }
        );

      if (profileError) {
        console.error("Profile upsert error:", profileError);
      }
    }

    return NextResponse.json({ success: true, message: "Onboarding completed successfully" });
  } catch (err) {
    console.error("Error completing onboarding:", err);
    return NextResponse.json({ error: "Failed to complete onboarding" }, { status: 500 });
  }
}
