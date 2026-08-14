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

    // First check profile with authenticated user client (matching auth.uid())
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("organization_id, onboarding_completed")
      .eq("id", user.id)
      .maybeSingle();

    let targetOrgId = userProfile?.organization_id;

    // Fallback: If not found via user client and admin client is available, check via admin client
    if (!targetOrgId && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const adminClient = createAdminClient();
      const { data: adminProfile } = await adminClient
        .from("profiles")
        .select("organization_id")
        .eq("id", user.id)
        .maybeSingle();
      targetOrgId = adminProfile?.organization_id;
    }

    const dbClient = process.env.SUPABASE_SERVICE_ROLE_KEY ? createAdminClient() : supabase;

    // 2. Update existing Organization OR Create new one if non-existent
    if (targetOrgId) {
      // Update existing organization
      const updates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (orgName?.trim()) {
        updates.name = orgName.trim();
      }

      // Fetch existing organization settings to preserve other keys
      const { data: org } = await dbClient
        .from("organizations")
        .select("settings")
        .eq("id", targetOrgId)
        .maybeSingle();

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

      const { error: updateOrgError } = await dbClient
        .from("organizations")
        .update(updates)
        .eq("id", targetOrgId);

      if (updateOrgError) {
        console.error("Organization update error:", updateOrgError);
      }
    } else {
      // Create new organization only if no organization was pre-created by trigger
      const finalOrgName = orgName?.trim() || `${user.email?.split("@")[0] || "My"}'s Organization`;
      const baseSlug = finalOrgName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "org";
      const uniqueSlug = `${baseSlug}-${user.id.slice(0, 6)}`;

      const { data: newOrg, error: orgError } = await dbClient
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
        return NextResponse.json({ error: `Failed to create organization: ${orgError.message}` }, { status: 500 });
      } else if (newOrg) {
        targetOrgId = newOrg.id;
      }
    }

    if (!targetOrgId) {
      return NextResponse.json({ error: "Organization could not be assigned" }, { status: 500 });
    }

    // 3. Update or Upsert profile record setting onboarding_completed = true
    const profileClient = process.env.SUPABASE_SERVICE_ROLE_KEY ? createAdminClient() : supabase;

    if (userProfile) {
      const { error: updateProfileError } = await profileClient
        .from("profiles")
        .update({
          organization_id: targetOrgId,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateProfileError) {
        console.error("Profile update error:", updateProfileError);
        return NextResponse.json({ error: `Failed to update profile: ${updateProfileError.message}` }, { status: 500 });
      }
    } else {
      const { error: profileError } = await profileClient
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
        console.error("Profile creation error:", profileError);
        return NextResponse.json({ error: `Failed to create profile: ${profileError.message}` }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, message: "Onboarding completed successfully" });
  } catch (err) {
    console.error("Error completing onboarding:", err);
    return NextResponse.json({ error: "Failed to complete onboarding" }, { status: 500 });
  }
}
