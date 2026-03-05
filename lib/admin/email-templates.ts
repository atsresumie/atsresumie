import type { EmailTemplateType } from "./schemas";

/**
 * Email templates matching the existing ATSResumie brand style.
 * Same design system as the welcome email in api/send-welcome-email/route.ts.
 */

interface TemplateConfig {
	defaultSubject: string;
	buildHtml: (vars: Record<string, string>) => string;
}

const TEMPLATE_MAP: Record<EmailTemplateType, TemplateConfig> = {
	support_reply: {
		defaultSubject: "ATSResumie Support — Your Request",
		buildHtml: (vars) =>
			wrapInBrand(`
      <p style="${pStyle}"><strong>Hi${vars.name ? ` ${vars.name}` : ""},</strong></p>
      <p style="${pStyle}">${escapeHtml(vars.body || "Thank you for reaching out. We've looked into your request and have some information for you.")}</p>
      <p style="${pStyle}">If you have any follow-up questions, just reply to this email.</p>
      <p style="${pStyle}">— The ATSResumie Team</p>
    `),
	},

	credits_granted: {
		defaultSubject: "Credits added to your ATSResumie account",
		buildHtml: (vars) =>
			wrapInBrand(`
      <p style="${pStyle}"><strong>Hi${vars.name ? ` ${vars.name}` : ""},</strong></p>
      <p style="${pStyle}">We've added <strong>${escapeHtml(vars.amount || "some")} credits</strong> to your account.</p>
      ${vars.reason ? `<p style="${pStyle}"><em>Reason: ${escapeHtml(vars.reason)}</em></p>` : ""}
      <p style="${pStyle}">Your updated balance is available in your <a href="https://atsresumie.com/dashboard/credits" style="color:#1a120e;font-weight:600;">dashboard</a>.</p>
      <p style="${pStyle}">— The ATSResumie Team</p>
    `),
	},

	billing_help: {
		defaultSubject: "ATSResumie — Billing Assistance",
		buildHtml: (vars) =>
			wrapInBrand(`
      <p style="${pStyle}"><strong>Hi${vars.name ? ` ${vars.name}` : ""},</strong></p>
      <p style="${pStyle}">${escapeHtml(vars.body || "We've reviewed your billing inquiry and wanted to follow up with you.")}</p>
      <p style="${pStyle}">If you need any further help, reply to this email and we'll get back to you promptly.</p>
      <p style="${pStyle}">— The ATSResumie Team</p>
    `),
	},

	custom: {
		defaultSubject: "Message from ATSResumie",
		buildHtml: (vars) =>
			wrapInBrand(`
      <p style="${pStyle}"><strong>Hi${vars.name ? ` ${vars.name}` : ""},</strong></p>
      <p style="${pStyle}">${escapeHtml(vars.body || "")}</p>
      <p style="${pStyle}">— The ATSResumie Team</p>
    `),
	},
};

// ── Public API ────────────────────────────────────────────────────────────

export function getDefaultSubject(templateType: EmailTemplateType): string {
	return TEMPLATE_MAP[templateType].defaultSubject;
}

export function buildEmailHtml(
	templateType: EmailTemplateType,
	variables: Record<string, string> = {},
): string {
	return TEMPLATE_MAP[templateType].buildHtml(variables);
}

// ── Brand wrapper (matches welcome email design) ─────────────────────────

const pStyle = "margin:0 0 16px;font-size:15px;line-height:1.7;color:#3d2e24;";

function wrapInBrand(bodyHtml: string): string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
</head>
<body style="margin:0;padding:0;background-color:#f5f1eb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f1eb;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
          <tr>
            <td style="background-color:#1a120e;padding:28px 40px;text-align:center;">
              <h1 style="margin:0;font-size:20px;font-weight:700;color:#E9DDC7;letter-spacing:-0.3px;">ATSResumie</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px 24px;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 40px 24px;border-top:1px solid #eee8df;">
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

function escapeHtml(str: string): string {
	return str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/\n/g, "<br />");
}
