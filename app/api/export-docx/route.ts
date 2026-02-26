import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
	applyStyleToLatex,
	validateStyledLatex,
} from "@/lib/latex/applyStyleToLatex";
import type { StyleConfig } from "@/types/editor";

const LATEX_ONLINE_URL = "https://latexonline.cc/compile";
const CONVERTAPI_URL = "https://v2.convertapi.com/convert/pdf/to/docx";
const DOCX_BUCKET = "generated-pdfs"; // reuse same bucket
const SIGNED_URL_EXPIRY_SECONDS = 600; // 10 minutes
const MAX_LATEX_LENGTH = 30000;

/**
 * POST /api/export-docx
 *
 * Pipeline: LaTeX → PDF (latexonline.cc) → DOCX (ConvertAPI)
 *
 * 1. Auth + ownership check
 * 2. Apply styleConfig via applyStyleToLatex()
 * 3. Compile LaTeX → PDF via latexonline.cc (same as PDF export)
 * 4. Convert PDF → DOCX via ConvertAPI
 * 5. Upload DOCX to Supabase Storage
 * 6. Return signed URL
 *
 * Request:  { jobId: string; styleConfig?: StyleConfig }
 * Response: { docxUrl: string }
 */
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { jobId, styleConfig } = body;

		// Validate inputs
		if (!jobId || typeof jobId !== "string") {
			return NextResponse.json(
				{ error: "jobId is required" },
				{ status: 400 },
			);
		}

		const convertApiSecret = process.env.CONVERTAPI_SECRET;
		if (!convertApiSecret) {
			return NextResponse.json(
				{
					error: "DOCX export is not configured.",
					details: "CONVERTAPI_SECRET is missing.",
				},
				{ status: 503 },
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

		// 2. Fetch job and verify ownership
		const { data: job, error: jobError } = await supabase
			.from("generation_jobs")
			.select("id, user_id, latex_text")
			.eq("id", jobId)
			.single();

		if (jobError || !job) {
			console.error("Job fetch error:", jobError);
			return NextResponse.json(
				{ error: "Job not found" },
				{ status: 404 },
			);
		}

		if (job.user_id !== user.id) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 403 },
			);
		}

		// 3. Check if LaTeX text exists
		if (!job.latex_text) {
			return NextResponse.json(
				{
					error: "LaTeX not generated yet. Please generate a resume first.",
				},
				{ status: 409 },
			);
		}

		// 4. Apply style configuration if provided
		let latex = job.latex_text;
		if (styleConfig && typeof styleConfig === "object") {
			console.log(`[export-docx] Applying style to job ${jobId}...`);
			latex = applyStyleToLatex(latex, styleConfig as StyleConfig);

			const validation = validateStyledLatex(latex);
			if (!validation.valid) {
				console.error(
					`[export-docx] Invalid styled LaTeX: ${validation.error}`,
				);
				return NextResponse.json(
					{ error: `Style application failed: ${validation.error}` },
					{ status: 400 },
				);
			}
		}

		// Size guard
		if (latex.length > MAX_LATEX_LENGTH) {
			return NextResponse.json(
				{
					error: "Resume too long to compile.",
					details: `LaTeX is ${latex.length} characters. Maximum is ${MAX_LATEX_LENGTH}.`,
				},
				{ status: 413 },
			);
		}

		// 5. Compile LaTeX → PDF (latexonline.cc)
		console.log(`[export-docx] Compiling LaTeX → PDF for job ${jobId}...`);
		const pdfBytes = await compileLatexToPdf(latex);

		if (!pdfBytes) {
			return NextResponse.json(
				{
					error: "PDF compilation failed.",
					details:
						"LaTeX could not be compiled. Try adjusting style settings.",
				},
				{ status: 400 },
			);
		}

		console.log(
			`[export-docx] PDF compiled (${pdfBytes.length} bytes). Converting to DOCX...`,
		);

		// 6. Convert PDF → DOCX via ConvertAPI
		const docxBytes = await convertPdfToDocx(pdfBytes, convertApiSecret);

		if (!docxBytes) {
			return NextResponse.json(
				{
					error: "DOCX conversion failed.",
					details: "ConvertAPI could not convert the PDF to DOCX.",
				},
				{ status: 500 },
			);
		}

		console.log(
			`[export-docx] DOCX generated (${docxBytes.length} bytes).`,
		);

		// 7. Upload DOCX to Supabase Storage
		const objectPath = `${user.id}/${jobId}/export.docx`;
		const admin = supabaseAdmin();

		const { error: uploadError } = await admin.storage
			.from(DOCX_BUCKET)
			.upload(objectPath, Buffer.from(docxBytes), {
				contentType:
					"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
				upsert: true,
			});

		if (uploadError) {
			console.error("Upload error:", uploadError);
			return NextResponse.json(
				{ error: "Failed to store DOCX" },
				{ status: 500 },
			);
		}

		console.log(
			`[export-docx] DOCX uploaded to ${DOCX_BUCKET}/${objectPath}`,
		);

		// 8. Generate and return signed URL
		const { data: signedUrlData, error: signedUrlError } =
			await admin.storage
				.from(DOCX_BUCKET)
				.createSignedUrl(objectPath, SIGNED_URL_EXPIRY_SECONDS);

		if (signedUrlError || !signedUrlData) {
			console.error("Signed URL error:", signedUrlError);
			return NextResponse.json(
				{
					error: "DOCX created but failed to generate download URL",
				},
				{ status: 500 },
			);
		}

		console.log(`[export-docx] Success! DOCX ready for job ${jobId}`);

		return NextResponse.json({
			docxUrl: signedUrlData.signedUrl,
		});
	} catch (error) {
		console.error("Error in /api/export-docx:", error);
		return NextResponse.json(
			{
				error: "Internal server error",
				details:
					error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}

// ---------------------------------------------------------------------------
// Step 1: Compile LaTeX → PDF via latexonline.cc
// ---------------------------------------------------------------------------

async function compileLatexToPdf(latex: string): Promise<Uint8Array | null> {
	const compileUrl = new URL(LATEX_ONLINE_URL);
	compileUrl.searchParams.set("text", latex);
	compileUrl.searchParams.set("force", "true");
	compileUrl.searchParams.set("command", "pdflatex");

	const response = await fetch(compileUrl.toString());

	if (!response.ok) {
		console.error(
			`[export-docx] latexonline.cc failed: ${response.status} ${response.statusText}`,
		);
		return null;
	}

	const contentType = response.headers.get("content-type") || "";
	if (!contentType.includes("application/pdf")) {
		const text = await response.text();
		console.error(
			`[export-docx] latexonline.cc returned non-PDF: ${contentType}`,
			text.slice(0, 500),
		);
		return null;
	}

	const buffer = await response.arrayBuffer();
	return new Uint8Array(buffer);
}

// ---------------------------------------------------------------------------
// Step 2: Convert PDF → DOCX via ConvertAPI
// https://v2.convertapi.com/convert/pdf/to/docx
// ---------------------------------------------------------------------------

async function convertPdfToDocx(
	pdfBytes: Uint8Array,
	secret: string,
): Promise<Uint8Array | null> {
	// ConvertAPI accepts base64-encoded file in JSON body
	const pdfBase64 = Buffer.from(pdfBytes).toString("base64");

	const response = await fetch(`${CONVERTAPI_URL}?Secret=${secret}`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			Parameters: [
				{
					Name: "File",
					FileValue: {
						Name: "resume.pdf",
						Data: pdfBase64,
					},
				},
			],
		}),
	});

	if (!response.ok) {
		const errText = await response.text();
		console.error(
			`[export-docx] ConvertAPI failed: ${response.status}`,
			errText,
		);
		return null;
	}

	const result = await response.json();

	// ConvertAPI returns: { Files: [{ FileName, FileData (base64) }] }
	const files = result.Files;
	if (!files || files.length === 0 || !files[0].FileData) {
		console.error(
			"[export-docx] ConvertAPI returned no files",
			JSON.stringify(result, null, 2),
		);
		return null;
	}

	const docxBase64: string = files[0].FileData;
	return new Uint8Array(Buffer.from(docxBase64, "base64"));
}
