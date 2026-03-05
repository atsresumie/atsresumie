import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/guard";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * GET /api/admin/overview
 *
 * Returns aggregate metrics for the admin dashboard overview.
 */
export async function GET() {
	try {
		await requireAdmin();
	} catch (err: unknown) {
		const e = err as { status?: number; message?: string };
		return NextResponse.json(
			{ error: e.message },
			{ status: e.status || 403 },
		);
	}

	try {
		const admin = supabaseAdmin();
		const now = new Date();
		const sevenDaysAgo = new Date(
			now.getTime() - 7 * 24 * 60 * 60 * 1000,
		).toISOString();
		const twentyFourHoursAgo = new Date(
			now.getTime() - 24 * 60 * 60 * 1000,
		).toISOString();

		const [
			totalUsers,
			activeSubs,
			creditsGrantedLogs,
			failedJobs,
			emailsSent,
		] = await Promise.all([
			// Total users
			admin
				.from("user_profiles")
				.select("*", { count: "exact", head: true }),

			// Active subscriptions
			admin
				.from("user_profiles")
				.select("*", { count: "exact", head: true })
				.eq("subscription_status", "active"),

			// Credit adjustments in last 7 days (from audit log)
			admin
				.from("admin_action_logs")
				.select("payload", { count: "exact" })
				.eq("action_type", "credit_adjustment")
				.gte("created_at", sevenDaysAgo),

			// Failed generation jobs in last 24h
			admin
				.from("generation_jobs")
				.select("*", { count: "exact", head: true })
				.eq("status", "failed")
				.gte("created_at", twentyFourHoursAgo),

			// Emails sent in last 7 days
			admin
				.from("admin_email_logs")
				.select("*", { count: "exact", head: true })
				.gte("created_at", sevenDaysAgo),
		]);

		// Sum credits granted from audit logs
		let creditsGranted7d = 0;
		if (creditsGrantedLogs.data) {
			for (const log of creditsGrantedLogs.data) {
				const payload = log.payload as { delta?: number } | null;
				if (payload?.delta && payload.delta > 0) {
					creditsGranted7d += payload.delta;
				}
			}
		}

		return NextResponse.json({
			totalUsers: totalUsers.count || 0,
			activeSubscriptions: activeSubs.count || 0,
			creditsGranted7d,
			failedJobs24h: failedJobs.count || 0,
			emailsSent7d: emailsSent.count || 0,
		});
	} catch (error) {
		console.error("[Admin Overview] Error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
