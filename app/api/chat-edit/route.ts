import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { validateStyledLatex } from "@/lib/latex/applyStyleToLatex";
import { sanitizeLatex } from "@/lib/latex/sanitizeLatex";
import { chatEditLatex } from "@/lib/llm/claudeChatEdit";
import type { ChatEditHistoryTurn } from "@/lib/llm/claudeChatEdit";

const LATEX_ONLINE_URL =
	process.env.LATEX_ENGINE_URL ??
	"https://latex-pdf-conversion-service.atsresumie.com/compile/pdf";
const PDF_BUCKET = "generated-pdfs";
const SIGNED_URL_EXPIRY_SECONDS = 600;
const MAX_LATEX_LENGTH = 30000;
const MAX_MESSAGE_LENGTH = 1000;
const RATE_LIMIT_PER_HOUR = 20;

// In-memory rate limiter: best-effort gate per-instance during alpha.
const rateLimitBuckets = new Map<string, number[]>();

function checkRateLimit(userId: string): { ok: boolean; retryAfterSec?: number } {
	const now = Date.now();
	const windowStart = now - 60 * 60 * 1000;

	const bucket = (rateLimitBuckets.get(userId) ?? []).filter(
		(t) => t > windowStart,
	);
	rateLimitBuckets.set(userId, bucket);

	if (bucket.length >= RATE_LIMIT_PER_HOUR) {
		const retryAfterSec = Math.max(
			1,
			Math.ceil((bucket[0] + 60 * 60 * 1000 - now) / 1000),
		);
		return { ok: false, retryAfterSec };
	}

	bucket.push(now);
	rateLimitBuckets.set(userId, bucket);
	return { ok: true };
}

function isHistoryTurn(value: unknown): value is ChatEditHistoryTurn {
	if (!value || typeof value !== "object") return false;
	const v = value as Record<string, unknown>;
	return (
		(v.role === "user" || v.role === "assistant") &&
		typeof v.content === "string"
	);
}

/**
 * POST /api/chat-edit
 *
 * Applies a chat-driven content edit to a generation's LaTeX, recompiles
 * via latex-online, persists the new LaTeX, and returns a signed PDF URL.
 *
 * Request:  { jobId: string; message: string; history?: ChatEditHistoryTurn[] }
 * Response: { pdfUrl: string; summary: string; styledPdfObjectPath: string }
 */
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { jobId, message } = body as {
			jobId?: unknown;
			message?: unknown;
		};
		const rawHistory = (body as { history?: unknown }).history;

		if (!jobId || typeof jobId !== "string") {
			return NextResponse.json(
				{ error: "jobId is required" },
				{ status: 400 },
			);
		}

		if (!message || typeof message !== "string" || message.trim().length < 2) {
			return NextResponse.json(
				{ error: "message is required" },
				{ status: 400 },
			);
		}

		if (message.length > MAX_MESSAGE_LENGTH) {
			return NextResponse.json(
				{ error: `message must be <= ${MAX_MESSAGE_LENGTH} characters` },
				{ status: 400 },
			);
		}

		const history: ChatEditHistoryTurn[] = Array.isArray(rawHistory)
			? rawHistory.filter(isHistoryTurn).slice(-12)
			: [];

		// Auth
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

		// Rate limit
		const limit = checkRateLimit(user.id);
		if (!limit.ok) {
			return NextResponse.json(
				{
					error: `Edit limit reached (${RATE_LIMIT_PER_HOUR}/hour). Try again later.`,
				},
				{
					status: 429,
					headers: { "Retry-After": String(limit.retryAfterSec ?? 60) },
				},
			);
		}

		// Ownership + LaTeX fetch
		const { data: job, error: jobError } = await supabase
			.from("generation_jobs")
			.select("id, user_id, latex_text, status")
			.eq("id", jobId)
			.single();

		if (jobError || !job) {
			return NextResponse.json({ error: "Job not found" }, { status: 404 });
		}

		if (job.user_id !== user.id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
		}

		if (!job.latex_text) {
			return NextResponse.json(
				{ error: "LaTeX not generated yet. Please generate a resume first." },
				{ status: 409 },
			);
		}

		// Claude edit
		const editResult = await chatEditLatex({
			currentLatex: job.latex_text,
			userMessage: message.trim(),
			history,
		});

		if (!editResult.success) {
			return NextResponse.json(
				{ error: editResult.error || "Couldn't apply that change" },
				{ status: 502 },
			);
		}

		const newLatex = editResult.latex;

		// Validate structure
		const validation = validateStyledLatex(newLatex);
		if (!validation.valid) {
			console.error(
				`[chat-edit] Edited LaTeX failed validation: ${validation.error}`,
			);
			return NextResponse.json(
				{
					error:
						"The AI returned LaTeX that didn't pass validation. Try rephrasing your request.",
				},
				{ status: 422 },
			);
		}

		if (newLatex.length > MAX_LATEX_LENGTH) {
			return NextResponse.json(
				{
					error: `Edited resume exceeds ${MAX_LATEX_LENGTH} characters. Try a smaller change.`,
				},
				{ status: 413 },
			);
		}

		// Sanitize + compile
		const cleanedLatex = sanitizeLatex(newLatex);
		const compileResult = await compileLatexWithRetry(cleanedLatex, jobId);

		if (!compileResult.ok || !compileResult.pdfBytes) {
			return NextResponse.json(
				{
					error:
						"Edited LaTeX failed to compile. Try rephrasing your request.",
				},
				{ status: 422 },
			);
		}

		// Upload + persist
		const admin = supabaseAdmin();
		const styledObjectPath = `${user.id}/${jobId}/styled.pdf`;

		const { error: uploadError } = await admin.storage
			.from(PDF_BUCKET)
			.upload(styledObjectPath, compileResult.pdfBytes, {
				contentType: "application/pdf",
				upsert: true,
			});

		if (uploadError) {
			console.error("[chat-edit] upload failed:", uploadError);
			return NextResponse.json(
				{ error: "Edit applied but failed to store PDF" },
				{ status: 500 },
			);
		}

		const updatePayload = {
			latex_text: newLatex,
			updated_at: new Date().toISOString(),
		};

		try {
			const { error: updateError } = await admin
				.from("generation_jobs")
				.update({
					...updatePayload,
					styled_pdf_object_path: styledObjectPath,
				})
				.eq("id", jobId);

			if (updateError) {
				// Column may not exist yet — fall back to base update.
				await admin
					.from("generation_jobs")
					.update(updatePayload)
					.eq("id", jobId);
			}
		} catch (err) {
			console.warn("[chat-edit] non-fatal job update failed:", err);
		}

		const { data: signedUrlData, error: signedUrlError } = await admin.storage
			.from(PDF_BUCKET)
			.createSignedUrl(styledObjectPath, SIGNED_URL_EXPIRY_SECONDS);

		if (signedUrlError || !signedUrlData) {
			console.error("[chat-edit] signed url failed:", signedUrlError);
			return NextResponse.json(
				{ error: "Edit applied but failed to generate PDF URL" },
				{ status: 500 },
			);
		}

		return NextResponse.json({
			pdfUrl: signedUrlData.signedUrl,
			styledPdfObjectPath: styledObjectPath,
			summary: editResult.summary,
			latex: newLatex,
		});
	} catch (error) {
		console.error("[chat-edit] unhandled:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

// ---------------------------------------------------------------------------
// Compile helper (mirrors export-pdf-with-style's retry pattern)
// ---------------------------------------------------------------------------

interface CompileResult {
	ok: boolean;
	pdfBytes?: Uint8Array;
	retried: boolean;
}

async function compileLatexWithRetry(
	latex: string,
	jobId: string,
): Promise<CompileResult> {
	const first = await compileSingleAttempt(latex);
	if (first.ok) {
		return { ok: true, pdfBytes: first.pdfBytes, retried: false };
	}

	console.warn(
		`[chat-edit] First compile failed for job ${jobId}, attempting retry...`,
	);

	const sanitized = sanitizeForRetry(latex);
	if (sanitized === latex) {
		return { ok: false, retried: false };
	}

	const retry = await compileSingleAttempt(sanitized);
	if (retry.ok) {
		return { ok: true, pdfBytes: retry.pdfBytes, retried: true };
	}

	return { ok: false, retried: true };
}

async function compileSingleAttempt(
	latex: string,
): Promise<{ ok: boolean; pdfBytes?: Uint8Array }> {
	const compileUrl = new URL(LATEX_ONLINE_URL);
	compileUrl.searchParams.set("force", "true");
	compileUrl.searchParams.set("command", "pdflatex");

	const response = await fetch(compileUrl.toString(), {
		method: "POST",
		headers: {
			"Content-Type": "text/plain",
			Accept: "application/pdf",
		},
		body: latex,
	});

	if (!response.ok) {
		const errorLog = await response.text();
		console.error("[chat-edit] compile failed:", errorLog.slice(0, 1500));
		return { ok: false };
	}

	const pdfBuffer = await response.arrayBuffer();
	return { ok: true, pdfBytes: new Uint8Array(pdfBuffer) };
}

function sanitizeForRetry(latex: string): string {
	let result = latex;

	result = result.replace(
		/^[ \t]*\\usepackage(\[[^\]]*\])?\{[^}]*\btitlesec\b[^}]*\}[ \t]*$\n?/gm,
		"",
	);
	result = result.replace(
		/^[ \t]*\\titlespacing\*?\{[^}]*\}\{[^}]*\}\{[^}]*\}\{[^}]*\}[ \t]*$\n?/gm,
		"",
	);
	result = result.replace(/^[ \t]*\\titleformat\*?\{[^}]*\}.*$\n?/gm, "");

	for (const pkg of ["fontspec", "unicode-math", "polyglossia"]) {
		result = result.replace(
			new RegExp(
				`^[ \\t]*\\\\usepackage(\\[[^\\]]*\\])?\\{${pkg}\\}[ \\t]*$\\n?`,
				"gm",
			),
			"",
		);
	}
	result = result.replace(
		/^[ \t]*\\(?:setmainfont|setsansfont|setmonofont)\{[^}]*\}[ \t]*$\n?/gm,
		"",
	);
	result = result.replace(
		/^[ \t]*\\(?:newfontfamily|defaultfontfeatures)\{?[^}\n]*\}?[ \t]*$\n?/gm,
		"",
	);

	return result;
}
