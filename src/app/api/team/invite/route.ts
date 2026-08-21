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

    const { email, role } = await req.json();

    if (!email || typeof email !== "string" || !email.trim()) {
      return NextResponse.json({ error: "Email address is required" }, { status: 400 });
    }

    const inviteRole = role === "admin" ? "admin" : "member";
    const cleanEmail = email.trim().toLowerCase();

    // 1. Get inviter's profile & organization details
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("organization_id, role, full_name, email")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || !profile.organization_id) {
      return NextResponse.json({ error: "Workspace profile not found" }, { status: 400 });
    }

    // Check permissions (Only Owner or Admin can manage team invites)
    if (profile.role !== "owner" && profile.role !== "admin") {
      return NextResponse.json({ error: "Only workspace Owners and Admins can invite team members" }, { status: 403 });
    }

    // Fetch org name
    const { data: org } = await supabase
      .from("organizations")
      .select("name")
      .eq("id", profile.organization_id)
      .single();

    const orgName = org?.name || "FTChat Workspace";
    const inviterName = profile.full_name || profile.email || "A team administrator";

    // 2. Check if user is already an active member of this organization
    const { data: existingMember } = await supabase
      .from("profiles")
      .select("id")
      .eq("organization_id", profile.organization_id)
      .eq("email", cleanEmail)
      .maybeSingle();

    if (existingMember) {
      return NextResponse.json({ error: "User with this email is already a member of this workspace" }, { status: 400 });
    }

    // 3. Upsert invitation in Supabase DB
    const { data: invitation, error: insertError } = await supabase
      .from("invitations")
      .upsert(
        {
          organization_id: profile.organization_id,
          email: cleanEmail,
          role: inviteRole,
          invited_by: user.id,
          status: "pending",
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
        { onConflict: "organization_id,email" }
      )
      .select()
      .single();

    if (insertError) {
      console.error("Invitation DB Insert Error:", insertError);
      return NextResponse.json({ error: insertError.message || "Failed to save invitation" }, { status: 500 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const inviteUrl = `${appUrl}/accept-invite?token=${invitation.token}`;

    // 4. Send invitation email via Resend if API key is present
    let emailSent = false;
    let emailMessage = "";

    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey && resendApiKey.trim() !== "" && !resendApiKey.includes("your_resend_api_key")) {
      try {
        const resend = new Resend(resendApiKey);
        const { error: sendError } = await resend.emails.send({
          from: EMAIL_CONFIG.FROM_EMAIL,
          to: [cleanEmail],
          subject: `You've been invited to join ${orgName} on FTChat`,
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
                  <div class="header">Join ${orgName} on FTChat</div>
                  <div class="badge">Role: ${inviteRole.toUpperCase()}</div>
                  <p class="body-text">
                    <strong>${inviterName}</strong> has invited you to join the <strong>${orgName}</strong> team workspace as an <strong>${inviteRole}</strong> on FTChat.
                  </p>
                  <p class="body-text">
                    Click the button below to accept your invitation and access your team dashboard:
                  </p>
                  <div style="text-align: center; margin: 28px 0;">
                    <a href="${inviteUrl}" class="cta-btn">Accept Invitation & Join Team</a>
                  </div>
                  <p class="body-text" style="font-size: 13px; color: #71717a;">
                    Or copy and paste this URL into your browser:<br>
                    <a href="${inviteUrl}" style="color: #4f46e5; word-break: break-all;">${inviteUrl}</a>
                  </p>
                  <div class="footer">
                    This invitation expires in 7 days. If you were not expecting this invite, you can safely ignore this email.
                  </div>
                </div>
              </body>
            </html>
          `,
        });

        if (sendError) {
          console.error("Resend API error:", sendError);
          emailMessage = `Invitation saved, but Resend email delivery failed: ${sendError.message}`;
        } else {
          emailSent = true;
          emailMessage = `Invitation email sent successfully to ${cleanEmail}`;
        }
      } catch (err) {
        console.error("Error sending Resend email:", err);
        emailMessage = "Invitation saved. Resend email sending encountered an error.";
      }
    } else {
      emailMessage = "Invitation saved to database. (Resend API key is not configured in backend .env yet, but invite link was generated successfully)";
    }

    return NextResponse.json({
      success: true,
      invitation,
      inviteUrl,
      emailSent,
      message: emailMessage,
    });
  } catch (err) {
    console.error("API /api/team/invite error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
