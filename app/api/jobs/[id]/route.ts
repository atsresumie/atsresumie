import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/jobs/[id]
 *
 * Get the status of a generation job.
 * Requires authenticated user. Uses RLS to ensure user can only see their own jobs.
 *
 * Response:
 * - id: string
 * - status: 'pending' | 'running' | 'succeeded' | 'failed'
 * - latexText: string | null
 * - pdfUrl: string | null
 * - errorMessage: string | null
 * - createdAt: string
 * - updatedAt: string
 * - startedAt: string | null
 * - completedAt: string | null
 */
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;

		if (!id) {
			return NextResponse.json(
				{ error: "Job ID is required" },
				{ status: 400 },
			);
		}

		// Require authenticated user (uses RLS)
		const supabase = await createSupabaseServerClient();
		const {
			data: { user },
			error: userError,
		} = await supabase.auth.getUser();

		if (userError || !user) {
			return NextResponse.json(
				{ error: "Unauthorized. Please sign in." },
				{ status: 401 },
			);
		}

		// Fetch job - RLS will ensure user can only see their own jobs
		const { data: job, error: jobError } = await supabase
			.from("generation_jobs")
			.select(
				"id, status, latex_text, pdf_url, error_message, created_at, updated_at, started_at, completed_at",
			)
			.eq("id", id)
			.single();

		if (jobError) {
			console.error("Error fetching job:", jobError);
			if (jobError.code === "PGRST116") {
				return NextResponse.json(
					{ error: "Job not found" },
					{ status: 404 },
				);
			}
			return NextResponse.json(
				{ error: "Failed to fetch job" },
				{ status: 500 },
			);
		}

		if (!job) {
			return NextResponse.json(
				{ error: "Job not found" },
				{ status: 404 },
			);
		}

		return NextResponse.json({
			id: job.id,
			status: job.status,
			latexText: job.latex_text,
			pdfUrl: job.pdf_url,
			errorMessage: job.error_message,
			createdAt: job.created_at,
			updatedAt: job.updated_at,
			startedAt: job.started_at,
			completedAt: job.completed_at,
		});
	} catch (error) {
		console.error("Error in /api/jobs/[id]:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
