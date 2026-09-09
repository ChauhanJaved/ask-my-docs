import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user || !user.email) {
      return NextResponse.json({ pendingInvitation: null }, { status: 200 });
    }

    const adminSupabase = createAdminClient();
    const cleanEmail = user.email.trim().toLowerCase();

    // Fetch latest active pending invitation for user's email
    const { data: invitation, error } = await adminSupabase
      .from("invitations")
      .select("id, token, organization_id, email, role, status, expires_at, invited_by, created_at")
      .ilike("email", cleanEmail)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .maybeSingle();

    if (error || !invitation) {
      return NextResponse.json({ pendingInvitation: null });
    }

    // Fetch organization details
    const { data: org } = await adminSupabase
      .from("organizations")
      .select("name")
      .eq("id", invitation.organization_id)
      .single();

    // Fetch inviter profile details if available
    let inviterName = "A team administrator";
    if (invitation.invited_by) {
      const { data: inviter } = await adminSupabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", invitation.invited_by)
        .maybeSingle();

      if (inviter) {
        inviterName = inviter.full_name || inviter.email || inviterName;
      }
    }

    return NextResponse.json({
      pendingInvitation: {
        id: invitation.id,
        token: invitation.token,
        organizationId: invitation.organization_id,
        organizationName: org?.name || "FTChat Workspace",
        role: invitation.role,
        inviterName,
        expiresAt: invitation.expires_at,
      },
    });
  } catch (err) {
    console.error("Error checking pending invitations:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
