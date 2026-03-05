import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/guard";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { UsersQuerySchema } from "@/lib/admin/schemas";

/**
 * GET /api/admin/users?query=&page=&pageSize=
 *
 * Search user_profiles by email, name, user_id, or stripe_customer_id.
 * Queries user_profiles only (no auth.users join).
 */
export async function GET(request: Request) {
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
		const url = new URL(request.url);
		const parsed = UsersQuerySchema.safeParse({
			query: url.searchParams.get("query") || undefined,
			page: url.searchParams.get("page") || undefined,
			pageSize: url.searchParams.get("pageSize") || undefined,
		});

		if (!parsed.success) {
			return NextResponse.json(
				{ error: parsed.error.flatten().fieldErrors },
				{ status: 400 },
			);
		}

		const { query, page, pageSize } = parsed.data;
		const admin = supabaseAdmin();

		// Build query
		let dbQuery = admin
			.from("user_profiles")
			.select(
				"id, email, name, credits, plan_name, subscription_status, stripe_customer_id, created_at, is_admin",
				{ count: "exact" },
			)
			.order("created_at", { ascending: false })
			.range((page - 1) * pageSize, page * pageSize - 1);

		// Search filter
		if (query) {
			// Check if query looks like a UUID
			const isUUID =
				/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
					query,
				);

			if (isUUID) {
				dbQuery = dbQuery.eq("id", query);
			} else if (query.startsWith("cus_")) {
				dbQuery = dbQuery.eq("stripe_customer_id", query);
			} else {
				// Search by email or name (case-insensitive)
				dbQuery = dbQuery.or(
					`email.ilike.%${query}%,name.ilike.%${query}%`,
				);
			}
		}

		const { data, error, count } = await dbQuery;

		if (error) {
			console.error("[Admin Users] Query error:", error);
			return NextResponse.json(
				{ error: "Failed to fetch users" },
				{ status: 500 },
			);
		}

		return NextResponse.json({
			users: data || [],
			total: count || 0,
			page,
			pageSize,
		});
	} catch (error) {
		console.error("[Admin Users] Unexpected error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
