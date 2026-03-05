import { supabaseAdmin } from "@/lib/supabase/admin";

const MAX_EMAILS_PER_MINUTE = 10;

/**
 * DB-backed rate limiter for admin email sends.
 *
 * Counts admin_email_logs for the given admin in the last 60 seconds.
 * Works correctly across serverless instances and cold starts.
 */
export async function checkEmailRateLimit(
	adminUserId: string,
): Promise<{ allowed: boolean; remaining: number }> {
	const admin = supabaseAdmin();

	const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString();

	const { count, error } = await admin
		.from("admin_email_logs")
		.select("*", { count: "exact", head: true })
		.eq("admin_user_id", adminUserId)
		.gte("created_at", oneMinuteAgo);

	if (error) {
		// Fail open but log — in production consider fail-closed
		console.error("[Rate Limit] Failed to check email rate:", error);
		return { allowed: true, remaining: MAX_EMAILS_PER_MINUTE };
	}

	const used = count ?? 0;
	const remaining = Math.max(0, MAX_EMAILS_PER_MINUTE - used);

	return {
		allowed: used < MAX_EMAILS_PER_MINUTE,
		remaining,
	};
}
