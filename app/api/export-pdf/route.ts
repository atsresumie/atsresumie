import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const LATEX_ONLINE_URL = "https://latexonline.cc/compile";
const PDF_BUCKET = "generated-pdfs";
const SIGNED_URL_EXPIRY_SECONDS = 600; // 10 minutes
const MAX_LATEX_LENGTH = 30000; // 30k chars - latex-online uses query string

/**
 * POST /api/export-pdf
 *
 * Compiles LaTeX to PDF using latex-online.cc, uploads to Supabase Storage,
 * and returns a signed URL.
 *
 * Request: { jobId: string }
 * Response: { pdfUrl: string }
 *
 * Credits are NOT deducted here - they were already deducted at LaTeX generation.
 */
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { jobId } = body;

		if (!jobId || typeof jobId !== "string") {
			return NextResponse.json(
				{ error: "jobId is required" },
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
			.select("id, user_id, latex_text, pdf_object_path, pdf_url")
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
				{ error: "LaTeX not generated yet. Please run preview first." },
				{ status: 409 },
			);
		}

		// 4. Size guard - latex-online uses query string which has limits
		if (job.latex_text.length > MAX_LATEX_LENGTH) {
			console.warn(
				`[export-pdf] LaTeX too long: ${job.latex_text.length} chars`,
			);
			return NextResponse.json(
				{
					error: "Resume too long to compile via external service.",
					details: `LaTeX is ${job.latex_text.length} characters. Maximum is ${MAX_LATEX_LENGTH}.`,
				},
				{ status: 413 },
			);
		}

		// 5. If PDF already exists, return signed URL (idempotent)
		if (job.pdf_object_path) {
			console.log(
				`[export-pdf] PDF exists, generating signed URL for ${job.pdf_object_path}`,
			);
			const admin = supabaseAdmin();
			const { data: signedUrlData, error: signedUrlError } =
				await admin.storage
					.from(PDF_BUCKET)
					.createSignedUrl(
						job.pdf_object_path,
						SIGNED_URL_EXPIRY_SECONDS,
					);

			if (signedUrlError || !signedUrlData) {
				// File was deleted from Storage but path remains in DB — clear it
				// and fall through to recompile from LaTeX
				console.warn(
					`[export-pdf] Stale pdf_object_path for job ${jobId}, clearing and recompiling`,
					signedUrlError,
				);
				await admin
					.from("generation_jobs")
					.update({
						pdf_object_path: null,
						updated_at: new Date().toISOString(),
					})
					.eq("id", jobId);
				// Fall through to compilation below
			} else {
				return NextResponse.json({ pdfUrl: signedUrlData.signedUrl });
			}
		}

		// 5. Compile LaTeX to PDF using latex-online.cc
		console.log(`[export-pdf] Compiling LaTeX for job ${jobId}...`);

		const compileUrl = new URL(LATEX_ONLINE_URL);
		compileUrl.searchParams.set("text", job.latex_text);
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
			const errorSnippet = errorLog.slice(0, 1500); // Store first 1500 chars for debugging
			console.error(`[export-pdf] Compilation failed:`, errorSnippet);

			// Store error snippet in generation_jobs for debugging
			const admin = supabaseAdmin();
			await admin
				.from("generation_jobs")
				.update({
					error_message: `PDF compile error: ${errorSnippet}`,
					updated_at: new Date().toISOString(),
				})
				.eq("id", jobId);

			return NextResponse.json(
				{
					error: "PDF compilation failed. Please try again.",
					details:
						"The LaTeX document has compilation errors. Try copying the LaTeX and compiling manually.",
				},
				{ status: 400 },
			);
		}

		// 6. Get PDF bytes
		const pdfBuffer = await compileResponse.arrayBuffer();
		const pdfBytes = new Uint8Array(pdfBuffer);

		console.log(
			`[export-pdf] PDF compiled successfully (${pdfBytes.length} bytes)`,
		);

		// 7. Upload to Supabase Storage
		const objectPath = `${user.id}/${jobId}.pdf`;
		const admin = supabaseAdmin();

		const { error: uploadError } = await admin.storage
			.from(PDF_BUCKET)
			.upload(objectPath, pdfBytes, {
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

		console.log(`[export-pdf] PDF uploaded to ${PDF_BUCKET}/${objectPath}`);

		// 8. Update job with pdf_object_path
		const { error: updateError } = await admin
			.from("generation_jobs")
			.update({
				pdf_object_path: objectPath,
				updated_at: new Date().toISOString(),
			})
			.eq("id", jobId);

		if (updateError) {
			console.error("Job update error:", updateError);
			// Non-fatal - PDF is still stored
		}

		// 9. Generate and return signed URL
		const { data: signedUrlData, error: signedUrlError } =
			await admin.storage
				.from(PDF_BUCKET)
				.createSignedUrl(objectPath, SIGNED_URL_EXPIRY_SECONDS);

		if (signedUrlError || !signedUrlData) {
			console.error("Signed URL error:", signedUrlError);
			return NextResponse.json(
				{ error: "PDF created but failed to generate download URL" },
				{ status: 500 },
			);
		}

		console.log(
			`[export-pdf] Success! Signed URL generated for job ${jobId}`,
		);

		return NextResponse.json({ pdfUrl: signedUrlData.signedUrl });
	} catch (error) {
		console.error("Error in /api/export-pdf:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
