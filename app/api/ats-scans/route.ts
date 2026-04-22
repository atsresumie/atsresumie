import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/ats-scans
 * Fetch ATS scan history for the authenticated user.
 *
 * POST /api/ats-scans
 * Save a new ATS scan result.
 */

export async function GET() {
	try {
		const supabase = await createSupabaseServerClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { data, error } = await supabase
			.from("ats_scans")
			.select("*")
			.eq("user_id", user.id)
			.order("created_at", { ascending: false })
			.limit(50);

		if (error) {
			console.error("[ats-scans] Failed to fetch scans:", error);
			return NextResponse.json(
				{ error: "Failed to fetch scan history" },
				{ status: 500 },
			);
		}

		return NextResponse.json(data);
	} catch (error) {
		console.error("[ats-scans] Unexpected error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

export async function POST(req: NextRequest) {
	try {
		const supabase = await createSupabaseServerClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await req.json();
		const {
			resumeLabel,
			resumeSource,
			resumeVersionId,
			generationJobId,
			jdSnippet,
			score,
			resultJson,
		} = body as {
			resumeLabel: string;
			resumeSource: string;
			resumeVersionId?: string;
			generationJobId?: string;
			jdSnippet?: string;
			score: number;
			resultJson: Record<string, unknown>;
		};

		// Validation
		if (!resumeLabel || !resumeSource || score == null || !resultJson) {
			return NextResponse.json(
				{ error: "Missing required fields" },
				{ status: 400 },
			);
		}

		const { data, error } = await supabase
			.from("ats_scans")
			.insert({
				user_id: user.id,
				resume_label: resumeLabel,
				resume_source: resumeSource,
				resume_version_id: resumeVersionId || null,
				generation_job_id: generationJobId || null,
				jd_snippet: jdSnippet || null,
				score,
				result_json: resultJson,
			})
			.select()
			.single();

		if (error) {
			console.error("[ats-scans] Failed to save scan:", error);
			return NextResponse.json(
				{ error: "Failed to save scan" },
				{ status: 500 },
			);
		}

		return NextResponse.json(data, { status: 201 });
	} catch (error) {
		console.error("[ats-scans] Unexpected error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
