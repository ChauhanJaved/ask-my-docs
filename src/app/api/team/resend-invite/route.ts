import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { Resend } from "resend";
import { EMAIL_CONFIG } from "@/lib/constants";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { invitationId } = await req.json();

    if (!invitationId) {
      return NextResponse.json({ error: "Invitation ID is required" }, { status: 400 });
    }

    // 1. Get user profile and verify admin/owner rights
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id, role, full_name, email")
      .eq("id", user.id)
      .single();

    if (!profile || (profile.role !== "owner" && profile.role !== "admin")) {
      return NextResponse.json({ error: "Unauthorized to manage team invites" }, { status: 403 });
    }

    // 2. Fetch target invitation
    const { data: invitation, error: fetchError } = await supabase
      .from("invitations")
      .select("id, email, role, token, organization_id")
      .eq("id", invitationId)
      .eq("organization_id", profile.organization_id)
      .single();

    if (fetchError || !invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    }

    // Refresh expiration date
    const { data: updatedInvite, error: updateError } = await supabase
      .from("invitations")
      .update({
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: "pending",
      })
      .eq("id", invitationId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Fetch org name
    const { data: org } = await supabase
      .from("organizations")
      .select("name")
      .eq("id", profile.organization_id)
      .single();

    const orgName = org?.name || "FTChat Workspace";
    const inviterName = profile.full_name || profile.email || "A team administrator";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const inviteUrl = `${appUrl}/accept-invite?token=${invitation.token}`;

    let emailSent = false;
    let message = "";

    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey && resendApiKey.trim() !== "" && !resendApiKey.includes("your_resend_api_key")) {
      try {
        const resend = new Resend(resendApiKey);
        const { error: sendError } = await resend.emails.send({
          from: EMAIL_CONFIG.FROM_EMAIL,
          to: [invitation.email],
          subject: `Reminder: You've been invited to join ${orgName} on FTChat`,
          html: `
            <!DOCTYPE html>
            <html>
              <head>
                <meta charset="utf-8">
                <style>
                  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 40px 20px; }
                  .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e4e4e7; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
                  .header { font-size: 20px; font-weight: 700; color: #18181b; margin-bottom: 16px; }
                  .badge { display: inline-block; background-color: #e0e7ff; color: #4338ca; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; margin-bottom: 20px; }
                  .body-text { font-size: 15px; color: #52525b; line-height: 1.6; margin-bottom: 24px; }
                  .cta-btn { display: inline-block; background-color: #4f46e5; color: #ffffff !important; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; text-align: center; }
                  .footer { margin-top: 32px; font-size: 12px; color: #a1a1aa; border-top: 1px solid #f4f4f5; padding-top: 16px; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">Invitation Reminder: Join ${orgName}</div>
                  <div class="badge">Role: ${invitation.role.toUpperCase()}</div>
                  <p class="body-text">
                    This is a reminder that <strong>${inviterName}</strong> invited you to join the <strong>${orgName}</strong> team workspace on FTChat.
                  </p>
                  <p class="body-text">
                    Click the button below to accept your invitation:
                  </p>
                  <div style="text-align: center; margin: 28px 0;">
                    <a href="${inviteUrl}" class="cta-btn">Accept Invitation & Join Team</a>
                  </div>
                  <p class="body-text" style="font-size: 13px; color: #71717a;">
                    Or copy and paste this link:<br>
                    <a href="${inviteUrl}" style="color: #4f46e5; word-break: break-all;">${inviteUrl}</a>
                  </p>
                  <div class="footer">
                    This invitation has been refreshed and expires in 7 days.
                  </div>
                </div>
              </body>
            </html>
          `,
        });

        if (!sendError) {
          emailSent = true;
          message = `Invitation email re-sent successfully to ${invitation.email}`;
        } else {
          message = `Invitation refreshed, but Resend failed: ${sendError.message}`;
        }
      } catch (err) {
        console.error("Resend error:", err);
        message = "Invitation refreshed, but email sending failed.";
      }
    } else {
      message = "Invitation refreshed. Invite link copied/available.";
    }

    return NextResponse.json({
      success: true,
      invitation: updatedInvite,
      inviteUrl,
      emailSent,
      message,
    });
  } catch (err) {
    console.error("Resend invite error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
