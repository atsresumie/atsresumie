import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const RESEND_API_KEY = process.env.RESEND_API_KEY;

/**
 * POST /api/send-welcome-email
 *
 * Sends a one-time welcome email to the authenticated user via Resend.
 * Deduplicates using `welcome_email_sent` column on user_profiles.
 */
export async function POST() {
	try {
		const supabase = await createSupabaseServerClient();

		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();

		if (authError || !user || !user.email) {
			return NextResponse.json({ sent: false }, { status: 200 });
		}

		// Check if welcome email was already sent
		const admin = supabaseAdmin();
		const { data: profile } = await admin
			.from("user_profiles")
			.select("welcome_email_sent")
			.eq("id", user.id)
			.single();

		if (profile?.welcome_email_sent) {
			return NextResponse.json({ sent: false, reason: "already_sent" });
		}

		if (!RESEND_API_KEY) {
			console.error("[Welcome Email] RESEND_API_KEY is not set");
			return NextResponse.json(
				{ error: "Email service not configured" },
				{ status: 500 },
			);
		}

		const firstName =
			user.user_metadata?.full_name?.split(" ")[0] ||
			user.user_metadata?.name?.split(" ")[0] ||
			"";

		const greeting = firstName ? `Hi ${firstName},` : "Welcome!";

		// Send the email via Resend
		const res = await fetch("https://api.resend.com/emails", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${RESEND_API_KEY}`,
			},
			body: JSON.stringify({
				from: "Atsresumie <noreply@atsresumie.com>",
				to: [user.email],
				subject:
					"Welcome to ATSResumie — your 3 free credits are ready",
				html: buildWelcomeHtml(greeting),
			}),
		});

		if (!res.ok) {
			const errBody = await res.text();
			console.error("[Welcome Email] Resend error:", res.status, errBody);
			return NextResponse.json(
				{ error: "Failed to send email" },
				{ status: 500 },
			);
		}

		// Mark as sent so we never send again
		await admin
			.from("user_profiles")
			.update({ welcome_email_sent: true })
			.eq("id", user.id);

		return NextResponse.json({ sent: true });
	} catch (error) {
		console.error("[Welcome Email] Unexpected error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

// ────────────────────────────────────────────────────────────────────────────
// HTML Template
// ────────────────────────────────────────────────────────────────────────────

function buildWelcomeHtml(greeting: string): string {
	return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Welcome to ATSResumie</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f1eb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

  <!-- Outer wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f1eb;">
    <tr>
      <td align="center" style="padding:40px 16px;">

        <!-- Card -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">

          <!-- Header band -->
          <tr>
            <td style="background-color:#1a120e;padding:32px 40px;text-align:center;">
              <h1 style="margin:0;font-size:22px;font-weight:700;color:#E9DDC7;letter-spacing:-0.3px;">
                ATSResumie
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px 28px;">
              <p style="margin:0 0 20px;font-size:17px;line-height:1.6;color:#1a120e;font-weight:600;">
                ${greeting}
              </p>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#3d2e24;">
                Thanks for signing up. You have <strong>3 free credits</strong> to start tailoring your resume to any job description.
              </p>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:#3d2e24;">
                Here's how it works:
              </p>

              <!-- Steps -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="padding:10px 0;vertical-align:top;width:36px;">
                    <div style="width:28px;height:28px;border-radius:50%;background-color:#1a120e;color:#E9DDC7;font-size:13px;font-weight:700;text-align:center;line-height:28px;">1</div>
                  </td>
                  <td style="padding:10px 0 10px 12px;font-size:14px;line-height:1.6;color:#3d2e24;">
                    <strong>Paste a job description</strong> — we'll extract the keywords that matter.
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;vertical-align:top;width:36px;">
                    <div style="width:28px;height:28px;border-radius:50%;background-color:#1a120e;color:#E9DDC7;font-size:13px;font-weight:700;text-align:center;line-height:28px;">2</div>
                  </td>
                  <td style="padding:10px 0 10px 12px;font-size:14px;line-height:1.6;color:#3d2e24;">
                    <strong>Upload your resume</strong> — PDF or DOCX, we handle both.
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;vertical-align:top;width:36px;">
                    <div style="width:28px;height:28px;border-radius:50%;background-color:#1a120e;color:#E9DDC7;font-size:13px;font-weight:700;text-align:center;line-height:28px;">3</div>
                  </td>
                  <td style="padding:10px 0 10px 12px;font-size:14px;line-height:1.6;color:#3d2e24;">
                    <strong>Download your ATS-optimized resume</strong> — ready to apply.
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:4px 0 24px;">
                    <a href="https://atsresumie.com/dashboard" target="_blank"
                       style="display:inline-block;padding:14px 36px;background-color:#1a120e;color:#E9DDC7;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;letter-spacing:-0.2px;">
                      Go to Dashboard →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:14px;line-height:1.6;color:#7a6b5e;">
                If you have any questions, just reply to this email — we're happy to help.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px 28px;border-top:1px solid #eee8df;">
              <p style="margin:0;font-size:12px;color:#a89a8a;text-align:center;">
                © ${new Date().getFullYear()} ATSResumie · <a href="https://atsresumie.com" style="color:#a89a8a;">atsresumie.com</a>
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;
}
