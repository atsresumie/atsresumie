import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/guard";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { GenerationsQuerySchema } from "@/lib/admin/schemas";

/**
 * GET /api/admin/generations?status=&pdf_status=&userId=&page=&pageSize=
 *
 * Lists generation jobs with filters. Uses service role to bypass RLS.
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
		const parsed = GenerationsQuerySchema.safeParse({
			status: url.searchParams.get("status") || undefined,
			pdf_status: url.searchParams.get("pdf_status") || undefined,
			userId: url.searchParams.get("userId") || undefined,
			page: url.searchParams.get("page") || undefined,
			pageSize: url.searchParams.get("pageSize") || undefined,
		});

		if (!parsed.success) {
			return NextResponse.json(
				{ error: parsed.error.flatten().fieldErrors },
				{ status: 400 },
			);
		}

		const { status, pdf_status, userId, page, pageSize } = parsed.data;
		const admin = supabaseAdmin();

		let dbQuery = admin
			.from("generation_jobs")
			.select(
				"id, user_id, status, pdf_status, created_at, updated_at, last_error, pdf_last_error, attempt_count, pdf_attempt_count, next_attempt_at, locked_at, started_at, completed_at",
				{ count: "exact" },
			)
			.order("created_at", { ascending: false })
			.range((page - 1) * pageSize, page * pageSize - 1);

		if (status) dbQuery = dbQuery.eq("status", status);
		if (pdf_status) dbQuery = dbQuery.eq("pdf_status", pdf_status);
		if (userId) dbQuery = dbQuery.eq("user_id", userId);

		const { data, error, count } = await dbQuery;

		if (error) {
			console.error("[Admin Generations] Query error:", error);
			return NextResponse.json(
				{ error: "Failed to fetch generations" },
				{ status: 500 },
			);
		}

		return NextResponse.json({
			generations: data || [],
			total: count || 0,
			page,
			pageSize,
		});
	} catch (error) {
		console.error("[Admin Generations] Error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
