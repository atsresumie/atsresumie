import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const ATS_SCORE_URL = process.env.ATS_SCORE_URL || "http://localhost:8081";

/**
 * POST /api/ats-score
 *
 * Accepts { objectPath } (Supabase storage path) and proxies to the
 * ATS_Score microservice /analyze/general endpoint.
 *
 * Returns the full scoring response from the microservice.
 */
export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const { objectPath } = body as { objectPath?: string };

		if (!objectPath || typeof objectPath !== "string") {
			return NextResponse.json(
				{ error: "objectPath is required" },
				{ status: 400 },
			);
		}

		// 1. Download the resume PDF from Supabase Storage
		const supabase = supabaseAdmin();
		const { data: fileData, error: downloadError } = await supabase.storage
			.from("resumes")
			.download(objectPath);

		if (downloadError || !fileData) {
			console.error("[ats-score] Failed to download resume:", downloadError);
			return NextResponse.json(
				{ error: "Failed to download resume from storage" },
				{ status: 500 },
			);
		}

		// 2. Build multipart form data to send to ATS_Score service
		const formData = new FormData();
		const fileName = objectPath.split("/").pop() || "resume.pdf";
		formData.append(
			"resume",
			new Blob([fileData], { type: "application/pdf" }),
			fileName,
		);

		// 3. Call the ATS_Score /analyze/general endpoint
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
		return NextResponse.json(scoreData);
	} catch (error) {
		console.error("[ats-score] Unexpected error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
