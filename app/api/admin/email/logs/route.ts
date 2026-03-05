import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/guard";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * GET /api/admin/email/logs?page=&pageSize=
 *
 * Returns paginated email log history for the Email Center.
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
		const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
		const pageSize = Math.min(
			100,
			Math.max(1, parseInt(url.searchParams.get("pageSize") || "20")),
		);

		const admin = supabaseAdmin();
		const { data, error, count } = await admin
			.from("admin_email_logs")
			.select("*", { count: "exact" })
			.order("created_at", { ascending: false })
			.range((page - 1) * pageSize, page * pageSize - 1);

		if (error) {
			return NextResponse.json(
				{ error: "Failed to fetch email logs" },
				{ status: 500 },
			);
		}

		return NextResponse.json({
			logs: data || [],
			total: count || 0,
			page,
			pageSize,
		});
	} catch {
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
