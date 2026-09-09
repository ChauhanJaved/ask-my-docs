import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user || !user.email) {
      return NextResponse.json({ error: "Authentication required to decline invitation" }, { status: 401 });
    }

    const { token, invitationId } = await req.json();

    if (!token && !invitationId) {
      return NextResponse.json({ error: "Missing invitation identifier" }, { status: 400 });
    }

    const adminSupabase = createAdminClient();

    let query = adminSupabase.from("invitations").select("id, email, status");
    if (token) {
      query = query.eq("token", token);
    } else {
      query = query.eq("id", invitationId);
    }

    const { data: invitation, error: fetchError } = await query.maybeSingle();

    if (fetchError || !invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    if (invitation.email.toLowerCase() !== user.email.toLowerCase()) {
      return NextResponse.json({ error: "Unauthorized: This invitation belongs to another email address" }, { status: 403 });
    }

    // Update status to declined
    const { error: updateError } = await adminSupabase
      .from("invitations")
      .update({ status: "declined" })
      .eq("id", invitation.id);

    if (updateError) {
      return NextResponse.json({ error: `Failed to decline invitation: ${updateError.message}` }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Invitation declined successfully.",
    });
  } catch (err) {
    console.error("Decline invitation error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
