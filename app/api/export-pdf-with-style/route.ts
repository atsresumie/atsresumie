import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
	applyStyleToLatex,
	validateStyledLatex,
} from "@/lib/latex/applyStyleToLatex";
import type { StyleConfig } from "@/types/editor";

const LATEX_ONLINE_URL = "https://latexonline.cc/compile";
const PDF_BUCKET = "generated-pdfs";
const SIGNED_URL_EXPIRY_SECONDS = 600; // 10 minutes
const MAX_LATEX_LENGTH = 30000; // 30k chars - latex-online uses query string

/**
 * POST /api/export-pdf-with-style
 *
 * Compiles LaTeX with injected style configuration to PDF,
 * uploads to Supabase Storage, and returns a signed URL.
 *
 * Request: { jobId: string; styleConfig: StyleConfig }
 * Response: { pdfUrl: string; styledPdfObjectPath: string }
 *
 * Does NOT modify pdf_object_path (preserves original export).
 * Uses styled_pdf_object_path for styled versions.
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

		if (!styleConfig || typeof styleConfig !== "object") {
			return NextResponse.json(
				{ error: "styleConfig is required" },
				{ status: 400 },
			);
		}

		// Validate styleConfig shape
		const validationError = validateStyleConfig(styleConfig);
		if (validationError) {
			return NextResponse.json(
				{ error: validationError },
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

		// 2. Fetch job and verify ownership
		const { data: job, error: jobError } = await supabase
			.from("generation_jobs")
			.select("id, user_id, latex_text, pdf_object_path")
			.eq("id", jobId)
			.single();

		if (jobError || !job) {
			console.error("Job fetch error:", jobError);
			return NextResponse.json(
				{ error: "Job not found" },
				{ status: 404 },
			);
		}

		// Verify ownership
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

		// 4. Apply style configuration to LaTeX
		console.log(
			`[export-pdf-with-style] Applying style to job ${jobId}...`,
		);
		const styledLatex = applyStyleToLatex(
			job.latex_text,
			styleConfig as StyleConfig,
		);

		// 5. Validate styled LaTeX
		const validation = validateStyledLatex(styledLatex);
		if (!validation.valid) {
			console.error(
				`[export-pdf-with-style] Invalid styled LaTeX: ${validation.error}`,
			);
			return NextResponse.json(
				{ error: `Style application failed: ${validation.error}` },
				{ status: 400 },
			);
		}

		// 6. Size guard - latex-online uses query string which has limits
		if (styledLatex.length > MAX_LATEX_LENGTH) {
			console.warn(
				`[export-pdf-with-style] LaTeX too long: ${styledLatex.length} chars`,
			);
			return NextResponse.json(
				{
					error: "Resume too long to compile via external service.",
					details: `LaTeX is ${styledLatex.length} characters. Maximum is ${MAX_LATEX_LENGTH}.`,
				},
				{ status: 413 },
			);
		}

		// 7. Compile LaTeX to PDF using latex-online.cc
		console.log(
			`[export-pdf-with-style] Compiling styled LaTeX for job ${jobId}...`,
		);

		const compileUrl = new URL(LATEX_ONLINE_URL);
		compileUrl.searchParams.set("text", styledLatex);
		compileUrl.searchParams.set("force", "true");
		compileUrl.searchParams.set("command", "pdflatex");

		const compileResponse = await fetch(compileUrl.toString(), {
			method: "GET",
			headers: {
				Accept: "application/pdf",
			},
		});

		if (!compileResponse.ok) {
			// Compilation failed - get error log
			const errorLog = await compileResponse.text();
			const errorSnippet = errorLog.slice(0, 1500);
			console.error(
				`[export-pdf-with-style] Compilation failed:`,
				errorSnippet,
			);

			return NextResponse.json(
				{
					error: "PDF compilation failed with styled settings.",
					details:
						"The LaTeX document has compilation errors. Try adjusting style settings or resetting to defaults.",
				},
				{ status: 400 },
			);
		}

		// 8. Get PDF bytes
		const pdfBuffer = await compileResponse.arrayBuffer();
		const pdfBytes = new Uint8Array(pdfBuffer);

		console.log(
			`[export-pdf-with-style] PDF compiled successfully (${pdfBytes.length} bytes)`,
		);

		// 9. Upload to Supabase Storage (styled path - preserves original)
		const styledObjectPath = `${user.id}/${jobId}/styled.pdf`;
		const admin = supabaseAdmin();

		const { error: uploadError } = await admin.storage
			.from(PDF_BUCKET)
			.upload(styledObjectPath, pdfBytes, {
				contentType: "application/pdf",
				upsert: true,
			});

		if (uploadError) {
			console.error("Upload error:", uploadError);
			return NextResponse.json(
				{ error: "Failed to store PDF" },
				{ status: 500 },
			);
		}

		console.log(
			`[export-pdf-with-style] PDF uploaded to ${PDF_BUCKET}/${styledObjectPath}`,
		);

		// 10. Update job (optionally save styled LaTeX)
		const updatePayload: Record<string, unknown> = {
			updated_at: new Date().toISOString(),
		};

		// If saveLatex flag is set, persist the styled LaTeX
		if (body.saveLatex === true) {
			updatePayload.latex_text = styledLatex;
			console.log(
				`[export-pdf-with-style] Saving styled LaTeX to DB for job ${jobId}`,
			);
		}

		// Try to update styled_pdf_object_path (column may not exist yet)
		try {
			const { error: updateError } = await admin
				.from("generation_jobs")
				.update({
					...updatePayload,
					styled_pdf_object_path: styledObjectPath,
				})
				.eq("id", jobId);

			if (updateError) {
				// If styled_pdf_object_path column doesn't exist, try without it
				console.warn(
					"Job update with styled path failed:",
					updateError,
				);
				await admin
					.from("generation_jobs")
					.update(updatePayload)
					.eq("id", jobId);
			}
		} catch {
			console.warn("Job update failed (non-fatal)");
		}

		// 11. Generate and return signed URL
		const { data: signedUrlData, error: signedUrlError } =
			await admin.storage
				.from(PDF_BUCKET)
				.createSignedUrl(styledObjectPath, SIGNED_URL_EXPIRY_SECONDS);

		if (signedUrlError || !signedUrlData) {
			console.error("Signed URL error:", signedUrlError);
			return NextResponse.json(
				{ error: "PDF created but failed to generate download URL" },
				{ status: 500 },
			);
		}

		console.log(
			`[export-pdf-with-style] Success! Signed URL generated for job ${jobId}`,
		);

		return NextResponse.json({
			pdfUrl: signedUrlData.signedUrl,
			styledPdfObjectPath: styledObjectPath,
		});
	} catch (error) {
		console.error("Error in /api/export-pdf-with-style:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

/**
 * Validate StyleConfig shape
 */
function validateStyleConfig(config: unknown): string | null {
	if (typeof config !== "object" || config === null) {
		return "styleConfig must be an object";
	}

	const c = config as Record<string, unknown>;

	// Page size
	if (!["letter", "a4"].includes(c.pageSize as string)) {
		return "pageSize must be 'letter' or 'a4'";
	}

	// Margins
	const marginFields = [
		"marginTopMm",
		"marginBottomMm",
		"marginLeftMm",
		"marginRightMm",
	];
	for (const field of marginFields) {
		const val = c[field];
		if (typeof val !== "number" || val < 5 || val > 50) {
			return `${field} must be a number between 5 and 50`;
		}
	}

	// Font size
	if (
		typeof c.baseFontSizePt !== "number" ||
		c.baseFontSizePt < 8 ||
		c.baseFontSizePt > 14
	) {
		return "baseFontSizePt must be a number between 8 and 14";
	}

	// Line height
	if (
		typeof c.lineHeight !== "number" ||
		c.lineHeight < 0.8 ||
		c.lineHeight > 2.0
	) {
		return "lineHeight must be a number between 0.8 and 2.0";
	}

	// Section spacing
	if (
		typeof c.sectionSpacingPt !== "number" ||
		c.sectionSpacingPt < 0 ||
		c.sectionSpacingPt > 20
	) {
		return "sectionSpacingPt must be a number between 0 and 20";
	}

	// Font family (optional - defaults to "default" if missing)
	const validFonts = [
		"default",
		"times",
		"helvetica",
		"palatino",
		"charter",
		"bookman",
		"lmodern",
	];
	if (c.fontFamily && !validFonts.includes(c.fontFamily as string)) {
		return `fontFamily must be one of: ${validFonts.join(", ")}`;
	}

	return null;
}
