// ==========================================================
// Supabase Edge Function: worker-generate-latex
// Cron-triggered worker that claims queued jobs and generates
// LaTeX via Claude. Does NOT compile PDF.
// ==========================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

// ==========================================================
// CORS & TYPES
// ==========================================================

const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers":
		"authorization, x-client-info, apikey, content-type",
};

interface WorkerPayload {
	jobId?: string;
	batchSize?: number;
}

interface ClaimedJob {
	id: string;
	user_id: string;
	jd_text: string;
	resume_text: string | null;
	resume_object_path: string | null;
	focus_prompt: string | null;
	mode: string | null;
	status: string;
	progress_stage: string;
	lock_id: string;
}

type GenerationMode = "quick" | "deep" | "scratch";

// Time budget: stop claiming new jobs after this many ms
const TIME_BUDGET_MS = 25_000;
const MAX_BATCH_SIZE = 3;
const MAX_RETRIES = 3;

// ==========================================================
// PROMPT TEMPLATES (copied from process-generation-job)
// ==========================================================

const QUICK_SYSTEM_PROMPT = `You are ATSResumie LaTeX Resume Generator.

OUTPUT RULES
- Output ONLY valid LaTeX source code. No markdown, no commentary.
- Must compile with pdflatex using common packages only.
- ATS-friendly: single column, no tables, no icons, no graphics.
- Truth-first: do not invent employers, titles, dates, degrees, or metrics.
- Aim for 1 page. Keep bullets concise with action verbs.`;

const DEEP_SYSTEM_PROMPT = `You are ATSResumie LaTeX Resume Generator (DEEP PREMIUM).
You are BOTH a senior resume strategist and an expert LaTeX typesetter.

NON-NEGOTIABLE OUTPUT RULES
- Output ONLY valid LaTeX source code. No markdown, no commentary, no JSON.
- Must compile with pdflatex using only common packages (no shell-escape, no external files, no images).
- ATS-friendly: single column, no tables/tabular*, no text boxes, no icons, no graphics, no multi-column.
- Truth-first: NEVER invent employers, titles, dates, degrees, credentials, or metrics.

DEEP MODE TYPESETTING CONTRACT (STRICT)
Your output must look professionally typeset with consistent rhythm and spacing.

1) Fonts (pdflatex-safe)
- Use one of these options only:
  A) \\usepackage{lmodern} (default), OR
  B) \\usepackage[scaled]{helvet} and \\renewcommand{\\familydefault}{\\sfdefault}
- Do NOT require XeLaTeX/LuaLaTeX. Do NOT use fontspec.

2) Page + spacing defaults
- article 10pt or 11pt
- geometry margins 0.6–0.8in
- \\pagenumbering{gobble}, \\setlength{\\parindent}{0pt}, tight but readable \\parskip
- Use enumitem for bullet spacing control.

3) Section headings MUST follow this pattern:
- Heading text (uppercase/bold)
- small vertical padding (~3pt)
- \\hrule directly beneath
- small vertical padding (~6pt) after hrule before content
- Consistent spacing across ALL sections (no random vspace values)

Implement a macro like:
\\newcommand{\\sectionheader}[1]{\\vspace{10pt}\\textbf{\\large #1}\\vspace{3pt}\\hrule\\vspace{6pt}}
and use it for every section heading.

4) Indentation + alignment (strict)
- Consistent alignment for role/company/location/date lines.
- Bullets must have consistent left margin and itemsep using enumitem.
- No large gaps; no cramped overlapping lines.

CONTENT RULES
- Reorder sections for best JD match:
  SUMMARY (3–4 lines) → SKILLS → EXPERIENCE → PROJECTS (if real) → EDUCATION → CERTIFICATIONS (if real)
- Bullet quality:
  - Most relevant role: 4–6 bullets
  - Others: 2–4 bullets
  - Action verb + scope + outcome (quantify ONLY if in source)
- Integrate keywords naturally. No keyword stuffing.

FINAL CHECKLIST
- Compiles with pdflatex
- Single-column, no tables, no images
- Every heading uses \\hrule with consistent spacing
- Clean indentation, consistent bullets, professional look
- Output ONLY LaTeX`;

const SCRATCH_SYSTEM_PROMPT = `You are ATSResumie LaTeX Resume Generator (FROM SCRATCH).
Your task is to BUILD a completely fresh resume structure from the provided content.

OUTPUT RULES
- Output ONLY valid LaTeX source code. No markdown, no commentary.
- Must compile with pdflatex using common packages only.
- ATS-friendly: single column, no tables, no icons, no graphics.
- Truth-first: extract and reorganize ONLY what exists in the source. Do not invent.

SCRATCH MODE APPROACH
- Parse the source resume content to extract: contact info, skills, experience, education, projects.
- Rebuild the resume with a clean, professional structure.
- You may reorganize, reword, and improve bullets—but stay truthful to the source.
- Create a professional SUMMARY based on extracted experience and target JD.
- Group and categorize skills logically.
- Format experience entries with clear role/company/dates and impactful bullets.

TEMPLATE
- Use article class 10pt or 11pt
- geometry with 0.6–0.8in margins
- enumitem for compact bullets
- Clean section headings (can use \\hrule or simple bold headers)
- Prefer 1 page unless content requires 2.

FINAL OUTPUT
Return ONLY valid LaTeX code.`;

const SYSTEM_PROMPTS: Record<GenerationMode, string> = {
	quick: QUICK_SYSTEM_PROMPT,
	deep: DEEP_SYSTEM_PROMPT,
	scratch: SCRATCH_SYSTEM_PROMPT,
};

// ==========================================================
// USER PROMPT TEMPLATES
// ==========================================================

const QUICK_MODE_TEMPLATE = `MODE: QUICK OPTIMIZE

TASK
Generate an ATS-safe LaTeX resume optimized for the job description using the provided resume content.
Make minimal structural changes: keep the candidate's existing sections and ordering where reasonable, but improve bullets and skills to match the JD.

INPUTS
- Job Description:
{{JD_TEXT}}

- Candidate Resume Content:
{{RESUME_TEXT}}

INSTRUCTIONS
1) Preserve factual info from the resume. Do not invent missing roles, dates, companies, degrees, or credentials.
2) Improve "EXPERIENCE" bullets for relevance to JD:
   - 3–6 bullets per role
   - action verb + task + outcome
   - add numbers ONLY if present in resume text
3) Create/clean "SKILLS" section:
   - prioritize skills appearing in JD that the candidate plausibly has based on resume
   - group skills into 3–5 categories (e.g., Languages, Frameworks, Tools, Concepts)
4) Keep it concise:
   - aim for 1 page
   - remove irrelevant or redundant bullets
5) If key standard sections are missing in resume but implied by content, you may add the section (e.g., PROJECTS) only if you can populate it from the resume text.

OUTPUT
Return ONLY LaTeX.`;

const DEEP_MODE_TEMPLATE = `MODE: DEEP TAILOR (Premium)

TASK
Generate an ATS-safe LaTeX resume deeply tailored to the job description.
Apply strict professional typesetting as per system instructions.

INPUTS
- Job Description:
{{JD_TEXT}}

- Candidate Resume Content:
{{RESUME_TEXT}}

- Target Role (inferred): {{TARGET_TITLE}}
- Key Keywords to Include: {{MUST_INCLUDE_KEYWORDS}}

INSTRUCTIONS
1) Truth-first: do not invent experience, tools, employers, dates, degrees, certifications, or metrics not present in inputs.
2) Reorder sections for best JD relevance:
   - SUMMARY (3–4 lines, role-aligned, keyword-rich but natural)
   - SKILLS (JD-aligned categories)
   - EXPERIENCE (most relevant roles first)
   - PROJECTS (only if real content exists)
   - EDUCATION (and CERTIFICATIONS if present)
3) Bullet quality bar:
   - 4–6 bullets for most relevant role, 2–4 for others
   - Each bullet should map to a JD requirement where possible
   - Avoid vague filler ("worked on", "helped with")
4) Integrate keywords naturally. No keyword stuffing.
5) Apply strict typesetting: section headers with \\hrule, consistent spacing, professional fonts.

OUTPUT
Return ONLY LaTeX.`;

const SCRATCH_MODE_TEMPLATE = `MODE: FROM SCRATCH (Rebuild)

TASK
Build a completely fresh ATS-safe LaTeX resume from the provided resume content, tailored to the job description.
Extract all relevant information and restructure it professionally.

INPUTS
- Job Description:
{{JD_TEXT}}

- Source Resume Content (to extract from):
{{RESUME_TEXT}}

INSTRUCTIONS
1) EXTRACT from source resume:
   - Contact info: name, email, phone, location, LinkedIn/GitHub/portfolio links
   - Skills: technical and soft skills mentioned
   - Experience: companies, titles, dates, responsibilities, achievements
   - Education: schools, degrees, dates
   - Projects: names, technologies, outcomes
   - Certifications: if any
2) REBUILD with fresh structure:
   - Write a strong SUMMARY (3–4 lines) aligned to JD
   - Group SKILLS by category, ordered by JD relevance
   - Format EXPERIENCE with clear role/company/dates and 3–6 impactful bullets per role
   - Include PROJECTS only if real content exists
   - Include EDUCATION and CERTIFICATIONS if present
3) Do NOT invent anything not in the source. If info is missing, omit it.
4) Keep ATS-safe: single column, no tables, no icons.
5) Prefer 1 page.

OUTPUT
Return ONLY LaTeX.`;

// ==========================================================
// TOKEN LIMITS & HELPERS
// ==========================================================

const TOKEN_LIMITS: Record<
	GenerationMode,
	{ jdText: number; resumeText: number }
> = {
	quick: { jdText: 6000, resumeText: 8000 },
	deep: { jdText: 10000, resumeText: 15000 },
	scratch: { jdText: 8000, resumeText: 12000 },
};

function truncateText(text: string, maxChars: number): string {
	if (text.length <= maxChars) return text;
	return (
		text.slice(0, maxChars) + "\n\n[... content truncated for length ...]"
	);
}

function deriveTargetTitle(jdText: string): string {
	const patterns = [
		/(?:job\s*title|position|role)\s*[:\-]\s*(.+)/i,
		/(?:we\s*(?:are|'re)\s*(?:looking|hiring)\s*(?:for|a)\s*)(.+?)(?:\.|,|to\s+join)/i,
		/^(.+?(?:engineer|developer|manager|analyst|designer|architect|lead|specialist|consultant|coordinator|director|vp|head))/im,
	];
	for (const pattern of patterns) {
		const match = jdText.match(pattern);
		if (match?.[1]) return match[1].trim().slice(0, 80);
	}
	const firstLine = jdText.split("\n").find((l) => l.trim().length > 5);
	if (firstLine && firstLine.length < 100) return firstLine.trim();
	return "";
}

function deriveKeywords(jdText: string): string {
	const lowerJd = jdText.toLowerCase();
	const techKeywords = [
		"javascript",
		"typescript",
		"python",
		"java",
		"c#",
		"c++",
		"go",
		"rust",
		"ruby",
		"php",
		"swift",
		"kotlin",
		"scala",
		"react",
		"angular",
		"vue",
		"next.js",
		"node.js",
		"express",
		"django",
		"flask",
		"spring",
		".net",
		"rails",
		"sql",
		"postgresql",
		"mysql",
		"mongodb",
		"redis",
		"elasticsearch",
		"dynamodb",
		"aws",
		"azure",
		"gcp",
		"docker",
		"kubernetes",
		"terraform",
		"jenkins",
		"ci/cd",
		"github actions",
		"microservices",
		"rest api",
		"graphql",
		"agile",
		"scrum",
		"tdd",
		"machine learning",
		"ai",
		"data science",
		"leadership",
		"communication",
		"problem-solving",
		"collaboration",
	];
	const found: string[] = [];
	for (const kw of techKeywords) {
		if (lowerJd.includes(kw) && found.length < 15) found.push(kw);
	}
	const expMatch = jdText.match(/(\d+\+?\s*years?)/gi);
	if (expMatch) found.push(...expMatch.slice(0, 2));
	return found.join(", ");
}

function buildUserPrompt(
	mode: GenerationMode,
	jdText: string,
	resumeText: string,
): string {
	switch (mode) {
		case "quick":
			return QUICK_MODE_TEMPLATE.replace("{{JD_TEXT}}", jdText).replace(
				"{{RESUME_TEXT}}",
				resumeText,
			);
		case "deep":
			return DEEP_MODE_TEMPLATE.replace("{{JD_TEXT}}", jdText)
				.replace("{{RESUME_TEXT}}", resumeText)
				.replace(
					"{{TARGET_TITLE}}",
					deriveTargetTitle(jdText) || "(infer from JD)",
				)
				.replace(
					"{{MUST_INCLUDE_KEYWORDS}}",
					deriveKeywords(jdText) || "(extract from JD)",
				);
		case "scratch":
			return SCRATCH_MODE_TEMPLATE.replace("{{JD_TEXT}}", jdText).replace(
				"{{RESUME_TEXT}}",
				resumeText,
			);
		default:
			return QUICK_MODE_TEMPLATE.replace("{{JD_TEXT}}", jdText).replace(
				"{{RESUME_TEXT}}",
				resumeText,
			);
	}
}

// ==========================================================
// CLAUDE API CALL
// ==========================================================

interface ClaudeResult {
	success: boolean;
	latex?: string;
	error?: string;
	httpStatus?: number;
}

async function callClaudeAPI(
	systemPrompt: string,
	userPrompt: string,
	maxTokens: number,
	apiKey: string,
): Promise<ClaudeResult> {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), 120_000);

	try {
		const response = await fetch("https://api.anthropic.com/v1/messages", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-api-key": apiKey,
				"anthropic-version": "2023-06-01",
			},
			body: JSON.stringify({
				model: "claude-sonnet-4-20250514",
				max_tokens: maxTokens,
				system: systemPrompt,
				messages: [{ role: "user", content: userPrompt }],
			}),
			signal: controller.signal,
		});

		clearTimeout(timeoutId);

		if (!response.ok) {
			const errorBody = await response.text();
			console.error("Claude API error:", response.status, errorBody);
			return {
				success: false,
				error: `Claude API error: ${response.status}`,
				httpStatus: response.status,
			};
		}

		const data = await response.json();
		const textBlock = data.content?.find(
			(b: { type: string }) => b.type === "text",
		);
		if (!textBlock || textBlock.type !== "text") {
			return { success: false, error: "Claude returned no text content" };
		}

		let latex = textBlock.text.trim();
		if (!latex || !latex.includes("\\documentclass")) {
			return { success: false, error: "Output missing \\documentclass" };
		}

		// Clean markdown fences
		if (latex.startsWith("```")) latex = latex.replace(/^```\w*\n?/, "");
		if (latex.endsWith("```")) latex = latex.replace(/\n?```$/, "");

		return { success: true, latex: latex.trim() };
	} catch (error) {
		clearTimeout(timeoutId);
		if (error instanceof Error && error.name === "AbortError") {
			return { success: false, error: "Claude API request timed out" };
		}
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
// RETRY LOGIC HELPERS
// ==========================================================

function computeBackoffSeconds(
	attemptCount: number,
	baseSeconds: number,
): number {
	// Exponential backoff: base * 2^attempt, capped at 10 min
	return Math.min(baseSeconds * Math.pow(2, attemptCount), 600);
}

async function requeueJobWithBackoff(
	supabase: ReturnType<typeof createClient>,
	jobId: string,
	attemptCount: number,
	errorMessage: string,
	baseBackoffSeconds: number,
): Promise<void> {
	const delaySec = computeBackoffSeconds(attemptCount, baseBackoffSeconds);
	const nextAttempt = new Date(Date.now() + delaySec * 1000).toISOString();

	await supabase
		.from("generation_jobs")
		.update({
			status: "queued",
			progress_stage: "queued",
			locked_at: null,
			lock_id: null,
			last_error: errorMessage.slice(0, 2000),
			next_attempt_at: nextAttempt,
			updated_at: new Date().toISOString(),
		})
		.eq("id", jobId);

	console.log(
		`[LaTeX Worker] Job ${jobId} re-queued, next attempt in ${delaySec}s`,
	);
}

async function failJobPermanently(
	supabase: ReturnType<typeof createClient>,
	jobId: string,
	errorMessage: string,
): Promise<void> {
	await supabase.rpc("complete_job", {
		p_job_id: jobId,
		p_status: "failed",
		p_error_message: errorMessage.slice(0, 2000),
	});
	console.log(
		`[LaTeX Worker] Job ${jobId} permanently failed: ${errorMessage.slice(0, 100)}`,
	);
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
		const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");

		if (!anthropicApiKey) {
			return new Response(
				JSON.stringify({ error: "ANTHROPIC_API_KEY not set" }),
				{
					status: 500,
					headers: {
						...corsHeaders,
						"Content-Type": "application/json",
					},
				},
			);
		}

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
			Math.max(payload.batchSize || 1, 1),
			MAX_BATCH_SIZE,
		);
		const results: Array<{ jobId: string; status: string }> = [];

		for (let i = 0; i < batchSize; i++) {
			// Time budget check
			if (Date.now() - startTime > TIME_BUDGET_MS) {
				console.log(
					`[LaTeX Worker] Time budget exhausted after ${i} jobs`,
				);
				break;
			}

			// 1. Claim job
			let claimResult;
			if (payload.jobId && i === 0) {
				claimResult = await supabase.rpc("claim_generation_job", {
					p_job_id: payload.jobId,
				});
			} else {
				claimResult = await supabase.rpc("claim_next_generation_job");
			}

			if (claimResult.error) {
				console.error("Claim error:", claimResult.error);
				break;
			}

			const jobs = claimResult.data as ClaimedJob[];
			if (!jobs || jobs.length === 0) {
				console.log("[LaTeX Worker] No more jobs to process");
				break;
			}

			const job = jobs[0];
			console.log(
				`[LaTeX Worker] Claimed job ${job.id}, mode: ${job.mode}`,
			);

			// 2. Validate required data
			if (!job.jd_text || !job.resume_text) {
				await failJobPermanently(
					supabase,
					job.id,
					"Missing jd_text or resume_text",
				);
				results.push({ jobId: job.id, status: "failed" });
				continue;
			}

			// 3. Update progress: calling_claude
			await supabase.rpc("update_job_progress", {
				p_job_id: job.id,
				p_progress_stage: "calling_claude",
			});

			// 4. Prepare inputs
			const mode: GenerationMode =
				(job.mode as GenerationMode) || "quick";
			const limits = TOKEN_LIMITS[mode];
			const jdText = truncateText(job.jd_text, limits.jdText);
			const resumeText = truncateText(job.resume_text, limits.resumeText);

			const systemPrompt = SYSTEM_PROMPTS[mode];
			const userPrompt = buildUserPrompt(mode, jdText, resumeText);
			const maxTokens =
				mode === "quick" ? 6000 : mode === "deep" ? 10000 : 8000;

			// 5. Call Claude
			console.log(
				`[LaTeX Worker] Calling Claude for job ${job.id} (mode: ${mode})`,
			);
			const result = await callClaudeAPI(
				systemPrompt,
				userPrompt,
				maxTokens,
				anthropicApiKey,
			);

			// 6. Update progress: validating
			await supabase.rpc("update_job_progress", {
				p_job_id: job.id,
				p_progress_stage: "validating",
			});

			if (!result.success || !result.latex) {
				// Determine retry strategy based on HTTP status
				const httpStatus = result.httpStatus || 0;

				if (httpStatus === 401) {
					// Auth failure — permanent fail
					await failJobPermanently(
						supabase,
						job.id,
						"Claude API auth failed (check ANTHROPIC_API_KEY)",
					);
				} else if (httpStatus === 429 || httpStatus >= 500) {
					// Rate limit or server error — re-queue with backoff
					// attempt_count was already incremented by claim RPC
					const currentAttempt =
						(job as unknown as { attempt_count?: number })
							.attempt_count || 1;
					if (currentAttempt >= MAX_RETRIES) {
						await failJobPermanently(
							supabase,
							job.id,
							`Max retries reached: ${result.error}`,
						);
					} else {
						const baseSec = httpStatus === 429 ? 60 : 30;
						await requeueJobWithBackoff(
							supabase,
							job.id,
							currentAttempt,
							result.error || "API error",
							baseSec,
						);
					}
				} else {
					// Other errors — retry up to max
					// Read attempt_count from DB to be safe
					const { data: jobData } = await supabase
						.from("generation_jobs")
						.select("attempt_count")
						.eq("id", job.id)
						.single();
					const attempts = jobData?.attempt_count || 1;
					if (attempts >= MAX_RETRIES) {
						await failJobPermanently(
							supabase,
							job.id,
							`Max retries: ${result.error}`,
						);
					} else {
						await requeueJobWithBackoff(
							supabase,
							job.id,
							attempts,
							result.error || "Generation failed",
							30,
						);
					}
				}
				results.push({ jobId: job.id, status: "retry_or_failed" });
				continue;
			}

			// 7. Success — save LaTeX (this sets pdf_status='queued' via updated complete_job RPC)
			console.log(
				`[LaTeX Worker] Job ${job.id} succeeded, latex length: ${result.latex.length}`,
			);
			await supabase.rpc("complete_job", {
				p_job_id: job.id,
				p_status: "succeeded",
				p_latex_text: result.latex,
			});

			// 8. Idempotent credit deduction
			console.log(`[LaTeX Worker] Deducting credit for job ${job.id}`);
			const { data: deductResult, error: deductError } =
				await supabase.rpc("deduct_credit_once", {
					p_job_id: job.id,
					p_user_id: job.user_id,
				});

			if (deductError) {
				console.error(
					`[LaTeX Worker] Credit deduction RPC error:`,
					deductError.message,
				);
			} else {
				console.log(
					`[LaTeX Worker] Credit deduction result: ${deductResult}`,
				);
			}

			results.push({ jobId: job.id, status: "succeeded" });
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
		console.error("[LaTeX Worker] Unexpected error:", error);
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
