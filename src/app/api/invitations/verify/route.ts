import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ valid: false, error: "Missing invitation token" }, { status: 400 });
  }

  try {
    const supabase = await createClient();

    // Query invitation by token
    const { data: invitation, error } = await supabase
      .from("invitations")
      .select("id, organization_id, email, role, status, expires_at, created_at")
      .eq("token", token)
      .maybeSingle();

    if (error || !invitation) {
      return NextResponse.json({ valid: false, error: "Invalid invitation link" }, { status: 444 });
    }

    if (invitation.status !== "pending") {
      return NextResponse.json({
        valid: false,
        error: `This invitation has already been ${invitation.status}`,
        status: invitation.status,
      });
    }

    const isExpired = new Date(invitation.expires_at) < new Date();
    if (isExpired) {
      return NextResponse.json({ valid: false, error: "This invitation has expired", isExpired: true });
    }

    // Fetch organization name
    const { data: org } = await supabase
      .from("organizations")
      .select("name, slug")
      .eq("id", invitation.organization_id)
      .single();

    return NextResponse.json({
      valid: true,
      email: invitation.email,
      role: invitation.role,
      organizationName: org?.name || "FTChat Workspace",
      expiresAt: invitation.expires_at,
    });
  } catch (err) {
    console.error("Error verifying invitation token:", err);
    return NextResponse.json({ valid: false, error: "Failed to verify invitation" }, { status: 500 });
  }
}
