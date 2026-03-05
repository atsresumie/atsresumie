import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/guard";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { EmailSendSchema } from "@/lib/admin/schemas";
import { buildEmailHtml, getDefaultSubject } from "@/lib/admin/email-templates";
import { checkEmailRateLimit } from "@/lib/admin/rate-limit";

const RESEND_API_KEY = process.env.RESEND_API_KEY;

/**
 * POST /api/admin/email/send
 *
 * Sends an email to a user via Resend.
 * Rate-limited (10/min per admin), logged to admin_email_logs.
 */
export async function POST(request: Request) {
	let adminUserId: string;
	try {
		const result = await requireAdmin();
		adminUserId = result.adminUserId;
	} catch (err: unknown) {
		const e = err as { status?: number; message?: string };
		return NextResponse.json(
			{ error: e.message },
			{ status: e.status || 403 },
		);
	}

	try {
		if (!RESEND_API_KEY) {
			return NextResponse.json(
				{ error: "RESEND_API_KEY not configured" },
				{ status: 500 },
			);
		}

		const body = await request.json();
		const parsed = EmailSendSchema.safeParse(body);

		if (!parsed.success) {
			return NextResponse.json(
				{ error: parsed.error.flatten().fieldErrors },
				{ status: 400 },
			);
		}

		const {
			targetUserId,
			toEmail,
			templateType,
			subject,
			body: emailBody,
			variables,
		} = parsed.data;

		// Rate limit check
		const { allowed, remaining } = await checkEmailRateLimit(adminUserId);
		if (!allowed) {
			return NextResponse.json(
				{ error: "Rate limit exceeded. Max 10 emails per minute." },
				{ status: 429 },
			);
		}

		// Build email
		const finalSubject = subject || getDefaultSubject(templateType);
		const mergedVars = { ...variables, body: emailBody || "" };
		const html = buildEmailHtml(templateType, mergedVars);

		// Send via Resend
		const admin = supabaseAdmin();
		let resendMessageId: string | null = null;
		let sendError: string | null = null;
		let sendStatus: "sent" | "failed" = "sent";

		try {
			const res = await fetch("https://api.resend.com/emails", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${RESEND_API_KEY}`,
				},
				body: JSON.stringify({
					from: "Atsresumie <noreply@atsresumie.com>",
					to: [toEmail],
					subject: finalSubject,
					html,
				}),
			});

			if (!res.ok) {
				const errBody = await res.text();
				console.error(
					"[Admin Email] Resend error:",
					res.status,
					errBody,
				);
				sendError = `Resend ${res.status}: ${errBody.substring(0, 500)}`;
				sendStatus = "failed";
			} else {
				const resBody = await res.json();
				resendMessageId = resBody.id || null;
			}
		} catch (fetchErr) {
			sendError =
				fetchErr instanceof Error
					? fetchErr.message
					: "Unknown send error";
			sendStatus = "failed";
		}

		// Log to admin_email_logs (always, even on failure)
		await admin.from("admin_email_logs").insert({
			admin_user_id: adminUserId,
			target_user_id: targetUserId,
			to_email: toEmail,
			subject: finalSubject,
			template_type: templateType,
			body_preview: (emailBody || "").substring(0, 200),
			status: sendStatus,
			resend_message_id: resendMessageId,
			error_message: sendError,
		});

		// Also log to audit trail
		await admin.from("admin_action_logs").insert({
			admin_user_id: adminUserId,
			target_user_id: targetUserId,
			action_type: "email_sent",
			payload: {
				template_type: templateType,
				subject: finalSubject,
				status: sendStatus,
				resend_message_id: resendMessageId,
			},
		});

		if (sendStatus === "failed") {
			return NextResponse.json(
				{ error: sendError || "Failed to send email" },
				{ status: 500 },
			);
		}

		return NextResponse.json({
			success: true,
			resendMessageId,
			remaining,
		});
	} catch (error) {
		console.error("[Admin Email] Error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
