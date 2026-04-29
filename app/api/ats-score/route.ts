import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const ATS_SCORE_URL = process.env.ATS_SCORE_URL || "http://localhost:8081";

/**
 * POST /api/ats-score
 *
 * Accepts { resumeVersionId } and proxies the owned resume to the
 * ATS_Score microservice /analyze/general endpoint, caching the result
 * on resume_versions.
 */
export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const { resumeVersionId } = body as {
			resumeVersionId?: string;
		};

		if (!resumeVersionId || typeof resumeVersionId !== "string") {
			return NextResponse.json(
				{ error: "resumeVersionId is required" },
				{ status: 400 },
			);
		}

		// 1. Require authenticated user
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

		// 2. Fetch resume version with user-scoped client and verify ownership
		const { data: version, error: versionError } = await supabase
			.from("resume_versions")
			.select("id, user_id, object_path")
			.eq("id", resumeVersionId)
			.single();

		if (versionError || !version) {
			return NextResponse.json(
				{ error: "Resume version not found" },
				{ status: 404 },
			);
		}

		if (version.user_id !== user.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
		}

		// 3. Download the resume PDF from Supabase Storage using the
		// server-trusted object_path (never the request body).
		const admin = supabaseAdmin();
		const { data: fileData, error: downloadError } = await admin.storage
			.from("resumes")
			.download(version.object_path);

		if (downloadError || !fileData) {
			console.error("[ats-score] Failed to download resume:", downloadError);
			return NextResponse.json(
				{ error: "Failed to download resume from storage" },
				{ status: 500 },
			);
		}

		// 4. Build multipart form data to send to ATS_Score service
		const formData = new FormData();
		const fileName = version.object_path.split("/").pop() || "resume.pdf";
		formData.append(
			"resume",
			new Blob([fileData], { type: "application/pdf" }),
			fileName,
		);

		// 5. Call the ATS_Score /analyze/general endpoint
		const scoreRes = await fetch(`${ATS_SCORE_URL}/analyze/general`, {
			method: "POST",
			body: formData,
		});

		if (!scoreRes.ok) {
			const errBody = await scoreRes.text();
			console.error(
				`[ats-score] Microservice returned ${scoreRes.status}:`,
				errBody,
			);
			return NextResponse.json(
				{ error: "ATS scoring failed", detail: errBody },
				{ status: scoreRes.status },
			);
		}

		const scoreData = await scoreRes.json();

		// 6. Persist the score on resume_versions so subsequent page visits
		// can skip the microservice round-trip. RLS enforces ownership.
		if (
			typeof scoreData?.score === "number" &&
			scoreData.score >= 0 &&
			scoreData.score <= 100
		) {
			const { error: updateError } = await supabase
				.from("resume_versions")
				.update({
					ats_score: Math.round(scoreData.score),
					ats_score_cached_at: new Date().toISOString(),
				})
				.eq("id", resumeVersionId);

			if (updateError) {
				console.warn(
					"[ats-score] Failed to cache score on resume_versions:",
					updateError.message,
				);
			}
		}

		return NextResponse.json(scoreData);
	} catch (error) {
		console.error("[ats-score] Unexpected error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
