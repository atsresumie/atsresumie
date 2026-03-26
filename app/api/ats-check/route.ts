import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { extractTextFromFile } from "@/lib/ats/extractText";

const ATS_SCORE_URL = process.env.ATS_SCORE_URL || "http://localhost:8081";

/**
 * POST /api/ats-check
 *
 * Proxies to ATS_Score microservice /analyze endpoint.
 *
 * Accepts JSON body:
 *   { jobDescription, resumeText }            — direct text
 *   { jobDescription, objectPath }            — resume from Supabase storage
 *
 * Or multipart form data:
 *   jobDescription + resumeFile (File)        — uploaded file
 */
export async function POST(req: NextRequest) {
	try {
		const contentType = req.headers.get("content-type") || "";
		let jobDescription: string;
		let resumeText: string;

		if (contentType.includes("multipart/form-data")) {
			// Form data path — file upload
			const formData = await req.formData();
			jobDescription = (formData.get("jobDescription") as string) || "";
			const resumeFile = formData.get("resumeFile") as File | null;
			const objectPath = formData.get("objectPath") as string | null;

			if (!jobDescription.trim()) {
				return NextResponse.json(
					{ error: "jobDescription is required" },
					{ status: 400 },
				);
			}

			if (resumeFile) {
				resumeText = await extractTextFromFile(resumeFile);
			} else if (objectPath) {
				resumeText = await extractResumeTextFromStorage(objectPath);
			} else {
				return NextResponse.json(
					{ error: "resumeFile or objectPath is required" },
					{ status: 400 },
				);
			}
		} else {
			// JSON path
			const body = await req.json();
			jobDescription = body.jobDescription || "";
			resumeText = body.resumeText || "";
			const objectPath = body.objectPath as string | undefined;

			if (!jobDescription.trim()) {
				return NextResponse.json(
					{ error: "jobDescription is required" },
					{ status: 400 },
				);
			}

			if (!resumeText.trim() && objectPath) {
				resumeText = await extractResumeTextFromStorage(objectPath);
			}

			if (!resumeText.trim()) {
				return NextResponse.json(
					{ error: "resumeText or objectPath is required" },
					{ status: 400 },
				);
			}
		}

		// Call the ATS_Score /analyze endpoint
		const scoreRes = await fetch(`${ATS_SCORE_URL}/analyze`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ jobDescription, resumeText }),
		});

		if (!scoreRes.ok) {
			const errBody = await scoreRes.text();
			console.error(
				`[ats-check] Microservice returned ${scoreRes.status}:`,
				errBody,
			);
			return NextResponse.json(
				{ error: "ATS analysis failed", detail: errBody },
				{ status: scoreRes.status },
			);
		}

		const data = await scoreRes.json();
		return NextResponse.json(data);
	} catch (error) {
		console.error("[ats-check] Unexpected error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

/**
 * Downloads a resume from Supabase storage and extracts text.
 */
async function extractResumeTextFromStorage(objectPath: string): Promise<string> {
	const supabase = supabaseAdmin();
	const { data, error } = await supabase.storage
		.from("resumes")
		.download(objectPath);

	if (error || !data) {
		throw new Error(`Failed to download resume: ${error?.message}`);
	}

	const fileName = objectPath.split("/").pop() || "resume.pdf";
	const file = new File([data], fileName, { type: data.type });
	return extractTextFromFile(file);
}
