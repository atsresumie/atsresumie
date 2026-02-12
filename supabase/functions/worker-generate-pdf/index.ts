// ==========================================================
// Supabase Edge Function: worker-generate-pdf
// Cron-triggered worker that compiles LaTeX to PDF and uploads.
// ==========================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers":
		"authorization, x-client-info, apikey, content-type",
};

interface WorkerPayload {
	jobId?: string;
	batchSize?: number;
}

interface ClaimedPdfJob {
	id: string;
	user_id: string;
	latex_text: string;
	pdf_status: string;
	pdf_attempt_count: number;
}

// Constants
const LATEX_ONLINE_URL = "https://latexonline.cc/compile";
const MAX_LATEX_LENGTH = 30_000;
const PDF_BUCKET = "generated-pdfs";
const TIME_BUDGET_MS = 50_000; // PDF compilation can be slower, allow 50s
const MAX_BATCH_SIZE = 5;
const MAX_PDF_RETRIES = 3;

// ==========================================================
// PDF COMPILATION & UPLOAD
// ==========================================================

async function compileAndUploadPDF(
	jobId: string,
	userId: string,
	latexText: string,
	supabase: ReturnType<typeof createClient>,
): Promise<{ success: boolean; objectPath?: string; error?: string }> {
	if (latexText.length > MAX_LATEX_LENGTH) {
		return {
			success: false,
			error: `LaTeX too long (${latexText.length} chars, max ${MAX_LATEX_LENGTH})`,
		};
	}

	try {
		console.log(`[PDF Worker] Compiling PDF for job ${jobId}...`);

		const compileUrl = new URL(LATEX_ONLINE_URL);
		compileUrl.searchParams.set("text", latexText);
		compileUrl.searchParams.set("force", "true");
		compileUrl.searchParams.set("command", "pdflatex");

		const response = await fetch(compileUrl.toString(), {
			method: "GET",
			headers: { Accept: "application/pdf" },
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error(
				`[PDF Worker] Compilation failed: ${errorText.slice(0, 300)}`,
			);
			return {
				success: false,
				error: `Compilation failed (${response.status}): ${errorText.slice(0, 500)}`,
			};
		}

		const pdfBuffer = await response.arrayBuffer();
		const pdfBytes = new Uint8Array(pdfBuffer);
		console.log(`[PDF Worker] Compiled (${pdfBytes.length} bytes)`);

		// Upload to Storage (upsert for idempotency)
		const objectPath = `${userId}/${jobId}.pdf`;
		const { error: uploadError } = await supabase.storage
			.from(PDF_BUCKET)
			.upload(objectPath, pdfBytes, {
				contentType: "application/pdf",
				upsert: true,
			});

		if (uploadError) {
			console.error(`[PDF Worker] Upload failed:`, uploadError.message);
			return {
				success: false,
				error: `Upload failed: ${uploadError.message}`,
			};
		}

		console.log(`[PDF Worker] Uploaded to ${objectPath}`);
		return { success: true, objectPath };
	} catch (error) {
		console.error(`[PDF Worker] Unexpected error:`, error);
		return {
			success: false,
			error:
				error instanceof Error
					? error.message.slice(0, 500)
					: "Unknown error",
		};
	}
}

// ==========================================================
// BACKOFF HELPER
// ==========================================================

function computeBackoffSeconds(attemptCount: number): number {
	return Math.min(45 * Math.pow(2, attemptCount), 600);
}

// ==========================================================
// MAIN HANDLER
// ==========================================================

Deno.serve(async (req) => {
	if (req.method === "OPTIONS") {
		return new Response("ok", { headers: corsHeaders });
	}

	const startTime = Date.now();

	try {
		const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
		const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
		const supabase = createClient(supabaseUrl, supabaseServiceKey);

		// Parse payload
		let payload: WorkerPayload = {};
		try {
			const text = await req.text();
			if (text) payload = JSON.parse(text);
		} catch {
			// empty body OK
		}

		const batchSize = Math.min(
			Math.max(payload.batchSize || 2, 1),
			MAX_BATCH_SIZE,
		);
		const results: Array<{ jobId: string; status: string }> = [];

		for (let i = 0; i < batchSize; i++) {
			// Time budget check
			if (Date.now() - startTime > TIME_BUDGET_MS) {
				console.log(
					`[PDF Worker] Time budget exhausted after ${i} jobs`,
				);
				break;
			}

			// 1. Claim a PDF job
			let claimedJob: ClaimedPdfJob | null = null;

			if (payload.jobId && i === 0) {
				// Specific job requested — claim it directly
				const { data, error } = await supabase
					.from("generation_jobs")
					.update({
						pdf_status: "processing",
						pdf_attempt_count: supabase.rpc ? undefined : 0, // handled below
						updated_at: new Date().toISOString(),
					})
					.eq("id", payload.jobId)
					.eq("status", "succeeded")
					.is("pdf_object_path", null)
					.select(
						"id, user_id, latex_text, pdf_status, pdf_attempt_count",
					)
					.single();

				if (!error && data) {
					// Increment pdf_attempt_count atomically
					await supabase.rpc("update_job_progress", {
						p_job_id: data.id,
						p_progress_stage: "pdf_compiling",
					});
					claimedJob = data as ClaimedPdfJob;
				}
			} else {
				// Use claim RPC
				const { data, error } =
					await supabase.rpc("claim_next_pdf_job");
				if (error) {
					console.error("[PDF Worker] Claim error:", error);
					break;
				}
				const jobs = data as ClaimedPdfJob[];
				if (jobs && jobs.length > 0) {
					claimedJob = jobs[0];
				}
			}

			if (!claimedJob) {
				console.log("[PDF Worker] No more PDF jobs to process");
				break;
			}

			console.log(`[PDF Worker] Processing job ${claimedJob.id}`);

			// 2. Validate latex_text
			if (!claimedJob.latex_text) {
				// Should not happen since claim RPC checks, but guard anyway
				await supabase
					.from("generation_jobs")
					.update({
						pdf_status: "failed",
						pdf_last_error: "No latex_text found",
						updated_at: new Date().toISOString(),
					})
					.eq("id", claimedJob.id);
				results.push({ jobId: claimedJob.id, status: "failed" });
				continue;
			}

			// 3. Compile and upload
			const compileResult = await compileAndUploadPDF(
				claimedJob.id,
				claimedJob.user_id,
				claimedJob.latex_text,
				supabase,
			);

			if (compileResult.success && compileResult.objectPath) {
				// 4a. Success — update pdf_object_path and pdf_status
				await supabase
					.from("generation_jobs")
					.update({
						pdf_object_path: compileResult.objectPath,
						pdf_status: "ready",
						pdf_last_error: null,
						updated_at: new Date().toISOString(),
					})
					.eq("id", claimedJob.id);

				console.log(`[PDF Worker] Job ${claimedJob.id} PDF ready`);
				results.push({ jobId: claimedJob.id, status: "ready" });
			} else {
				// 4b. Failure — set pdf_status and schedule retry
				const attempts = claimedJob.pdf_attempt_count;
				const isPermanentFail = attempts >= MAX_PDF_RETRIES;
				const backoffSec = computeBackoffSeconds(attempts);
				const nextAttempt = new Date(
					Date.now() + backoffSec * 1000,
				).toISOString();

				await supabase
					.from("generation_jobs")
					.update({
						pdf_status: "failed",
						pdf_last_error: (
							compileResult.error || "Unknown error"
						).slice(0, 2000),
						pdf_next_attempt_at: isPermanentFail
							? null
							: nextAttempt,
						updated_at: new Date().toISOString(),
					})
					.eq("id", claimedJob.id);

				if (isPermanentFail) {
					console.log(
						`[PDF Worker] Job ${claimedJob.id} permanently failed after ${attempts} attempts`,
					);
				} else {
					console.log(
						`[PDF Worker] Job ${claimedJob.id} failed, retry in ${backoffSec}s`,
					);
				}
				results.push({
					jobId: claimedJob.id,
					status: isPermanentFail ? "permanently_failed" : "retry",
				});
			}
		}

		return new Response(
			JSON.stringify({
				processed: results.length,
				results,
				elapsedMs: Date.now() - startTime,
			}),
			{
				status: 200,
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			},
		);
	} catch (error) {
		console.error("[PDF Worker] Unexpected error:", error);
		return new Response(
			JSON.stringify({
				error: error instanceof Error ? error.message : "Unknown error",
			}),
			{
				status: 500,
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			},
		);
	}
});
