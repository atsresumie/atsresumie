import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/guard";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * GET /api/admin/users/[id]
 *
 * Returns user profile + auth metadata (via auth.admin.getUserById)
 * + aggregate counts for purchases, generations, emails, admin actions.
 */
export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
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
		const { id } = await params;
		const admin = supabaseAdmin();

		// Fetch profile from user_profiles
		const { data: profile, error: profileError } = await admin
			.from("user_profiles")
			.select("*")
			.eq("id", id)
			.single();

		if (profileError || !profile) {
			return NextResponse.json(
				{ error: "User not found" },
				{ status: 404 },
			);
		}

		// Fetch auth metadata (email, last_sign_in_at, etc.)
		const {
			data: { user: authUser },
		} = await admin.auth.admin.getUserById(id);

		// Aggregate counts (parallel)
		const [genCount, purchaseCount, emailCount, actionCount] =
			await Promise.all([
				admin
					.from("generation_jobs")
					.select("*", { count: "exact", head: true })
					.eq("user_id", id),
				admin
					.from("credit_purchases")
					.select("*", { count: "exact", head: true })
					.eq("user_id", id),
				admin
					.from("admin_email_logs")
					.select("*", { count: "exact", head: true })
					.eq("target_user_id", id),
				admin
					.from("admin_action_logs")
					.select("*", { count: "exact", head: true })
					.eq("target_user_id", id),
			]);

		// Fetch recent data for tabs
		const [generations, purchases, emailLogs, actionLogs] =
			await Promise.all([
				admin
					.from("generation_jobs")
					.select(
						"id, status, pdf_status, created_at, updated_at, last_error, pdf_last_error, attempt_count, pdf_attempt_count",
					)
					.eq("user_id", id)
					.order("created_at", { ascending: false })
					.limit(50),
				admin
					.from("credit_purchases")
					.select("*")
					.eq("user_id", id)
					.order("created_at", { ascending: false })
					.limit(50),
				admin
					.from("admin_email_logs")
					.select("*")
					.eq("target_user_id", id)
					.order("created_at", { ascending: false })
					.limit(50),
				admin
					.from("admin_action_logs")
					.select("*")
					.eq("target_user_id", id)
					.order("created_at", { ascending: false })
					.limit(50),
			]);

		return NextResponse.json({
			profile,
			authUser: authUser
				? {
						email: authUser.email,
						created_at: authUser.created_at,
						last_sign_in_at: authUser.last_sign_in_at,
						email_confirmed_at: authUser.email_confirmed_at,
						user_metadata: authUser.user_metadata,
					}
				: null,
			counts: {
				generations: genCount.count || 0,
				purchases: purchaseCount.count || 0,
				emails: emailCount.count || 0,
				adminActions: actionCount.count || 0,
			},
			generations: generations.data || [],
			purchases: purchases.data || [],
			emailLogs: emailLogs.data || [],
			actionLogs: actionLogs.data || [],
		});
	} catch (error) {
		console.error("[Admin User Detail] Error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
