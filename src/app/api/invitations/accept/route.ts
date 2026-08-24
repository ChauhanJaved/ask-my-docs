import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Authentication required to accept invitation" }, { status: 401 });
    }

    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "Missing invitation token" }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    // 1. Fetch invitation using admin client
    const { data: invitation, error: inviteError } = await adminSupabase
      .from("invitations")
      .select("id, organization_id, email, role, status, expires_at")
      .eq("token", token)
      .maybeSingle();

    if (inviteError || !invitation) {
      return NextResponse.json({ error: "Invalid invitation" }, { status: 404 });
    }

    if (invitation.status !== "pending") {
      return NextResponse.json({ error: `This invitation has already been ${invitation.status}` }, { status: 400 });
    }

    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json({ error: "This invitation link has expired. Please ask your administrator to resend it." }, { status: 400 });
    }

    // 2. Update current user's profile using admin client to set new org & role
    const { error: profileUpdateError } = await adminSupabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          email: user.email ?? invitation.email,
          organization_id: invitation.organization_id,
          role: invitation.role,
          full_name:
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split("@")[0] ||
            "Team Member",
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

    if (profileUpdateError) {
      console.error("Profile update error on accepting invite:", profileUpdateError);
      return NextResponse.json({ error: `Failed to join workspace: ${profileUpdateError.message}` }, { status: 500 });
    }

    // 3. Mark invitation as accepted using admin client
    await adminSupabase
      .from("invitations")
      .update({ status: "accepted" })
      .eq("id", invitation.id);

    return NextResponse.json({
      success: true,
      message: "Invitation accepted successfully! Redirecting to workspace...",
    });
  } catch (err) {
    console.error("Accept invitation error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
