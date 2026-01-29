// ==========================================================
// Supabase Edge Function: process-generation-job
// Worker that claims and processes resume generation jobs
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

interface JobPayload {
	jobId?: string;
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

// ==========================================================
// PROMPT TEMPLATES (Ported from lib/llm/prompts.ts)
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
// TOKEN LIMITS (prevent bloat)
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

// ==========================================================
// HELPER FUNCTIONS
// ==========================================================

function deriveTargetTitle(jdText: string): string {
	const patterns = [
		/(?:job\s*title|position|role)\s*[:\-]\s*(.+)/i,
		/(?:we\s*(?:are|'re)\s*(?:looking|hiring)\s*(?:for|a)\s*)(.+?)(?:\.|,|to\s+join)/i,
		/^(.+?(?:engineer|developer|manager|analyst|designer|architect|lead|specialist|consultant|coordinator|director|vp|head))/im,
	];

	for (const pattern of patterns) {
		const match = jdText.match(pattern);
		if (match && match[1]) {
			return match[1].trim().slice(0, 80);
		}
	}

	const firstLine = jdText.split("\n").find((l) => l.trim().length > 5);
	if (firstLine && firstLine.length < 100) {
		return firstLine.trim();
	}

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

	const foundKeywords: string[] = [];
	for (const kw of techKeywords) {
		if (lowerJd.includes(kw) && foundKeywords.length < 15) {
			foundKeywords.push(kw);
		}
	}

	const expMatch = jdText.match(/(\d+\+?\s*years?)/gi);
	if (expMatch) {
		foundKeywords.push(...expMatch.slice(0, 2));
	}

	return foundKeywords.join(", ");
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
// ANTHROPIC API CALL (via fetch)
// ==========================================================

async function callClaudeAPI(
	systemPrompt: string,
	userPrompt: string,
	maxTokens: number,
	apiKey: string,
): Promise<{ success: boolean; latex?: string; error?: string }> {
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout

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
				messages: [
					{
						role: "user",
						content: userPrompt,
					},
				],
			}),
			signal: controller.signal,
		});

		clearTimeout(timeoutId);

		if (!response.ok) {
			const errorBody = await response.text();
			console.error("Claude API error:", response.status, errorBody);

			if (response.status === 401) {
				return {
					success: false,
					error: "Claude API authentication failed",
				};
			}
			if (response.status === 429) {
				return {
					success: false,
					error: "Claude API rate limit exceeded. Please try again shortly.",
				};
			}
			if (response.status >= 500) {
				return {
					success: false,
					error: "Claude API is temporarily unavailable. Please try again.",
				};
			}
			return {
				success: false,
				error: `Claude API error: ${response.status}`,
			};
		}

		const data = await response.json();

		const textBlock = data.content?.find(
			(block: { type: string }) => block.type === "text",
		);
		if (!textBlock || textBlock.type !== "text") {
			return { success: false, error: "Claude returned no text content" };
		}

		let latex = textBlock.text.trim();

		// Basic validation
		if (!latex || !latex.includes("\\documentclass")) {
			return {
				success: false,
				error: "Generated output does not appear to be valid LaTeX (missing \\documentclass)",
			};
		}

		// Clean up markdown fences if present
		if (latex.startsWith("```")) {
			latex = latex.replace(/^```\w*\n?/, "");
		}
		if (latex.endsWith("```")) {
			latex = latex.replace(/\n?```$/, "");
		}

		return { success: true, latex: latex.trim() };
	} catch (error) {
		clearTimeout(timeoutId);

		if (error instanceof Error) {
			if (error.name === "AbortError") {
				return {
					success: false,
					error: "Claude API request timed out",
				};
			}
			return { success: false, error: error.message.slice(0, 500) };
		}
		return {
			success: false,
			error: "Unknown error during Claude API call",
		};
	}
}

// ==========================================================
// MAIN HANDLER
// ==========================================================

Deno.serve(async (req) => {
	// Handle CORS preflight
	if (req.method === "OPTIONS") {
		return new Response("ok", { headers: corsHeaders });
	}

	try {
		const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
		const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
		const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");

		if (!anthropicApiKey) {
			console.error("ANTHROPIC_API_KEY not set");
			return new Response(
				JSON.stringify({
					error: "Server configuration error: missing API key",
				}),
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

		// Parse request body
		let payload: JobPayload = {};
		try {
			const text = await req.text();
			if (text) {
				payload = JSON.parse(text);
			}
		} catch {
			// Empty body is OK - will claim next job
		}

		console.log(
			`[Worker] Processing job request, jobId: ${payload.jobId || "next"}`,
		);

		// 1. Claim job
		let claimResult;
		if (payload.jobId) {
			claimResult = await supabase.rpc("claim_generation_job", {
				p_job_id: payload.jobId,
			});
		} else {
			claimResult = await supabase.rpc("claim_next_generation_job");
		}

		if (claimResult.error) {
			console.error("Claim error:", claimResult.error);
			return new Response(
				JSON.stringify({
					processed: false,
					error: claimResult.error.message,
				}),
				{
					status: 500,
					headers: {
						...corsHeaders,
						"Content-Type": "application/json",
					},
				},
			);
		}

		const jobs = claimResult.data as ClaimedJob[];
		if (!jobs || jobs.length === 0) {
			console.log("[Worker] No jobs to process");
			return new Response(
				JSON.stringify({
					processed: false,
					message: "No jobs in queue",
				}),
				{
					status: 200,
					headers: {
						...corsHeaders,
						"Content-Type": "application/json",
					},
				},
			);
		}

		const job = jobs[0];
		console.log(`[Worker] Claimed job ${job.id}, mode: ${job.mode}`);

		// 2. Validate we have required data
		if (!job.jd_text || !job.resume_text) {
			console.error(`[Worker] Job ${job.id} missing required data`);
			await supabase.rpc("complete_job", {
				p_job_id: job.id,
				p_status: "failed",
				p_error_message: "Job missing required jd_text or resume_text",
			});
			return new Response(
				JSON.stringify({
					processed: true,
					jobId: job.id,
					status: "failed",
					error: "Missing data",
				}),
				{
					status: 200,
					headers: {
						...corsHeaders,
						"Content-Type": "application/json",
					},
				},
			);
		}

		// 3. Update progress: calling_claude
		await supabase.rpc("update_job_progress", {
			p_job_id: job.id,
			p_progress_stage: "calling_claude",
		});

		// 4. Prepare inputs with token limits
		const mode: GenerationMode = (job.mode as GenerationMode) || "quick";
		const limits = TOKEN_LIMITS[mode];
		const jdText = truncateText(job.jd_text, limits.jdText);
		const resumeText = truncateText(job.resume_text, limits.resumeText);

		const systemPrompt = SYSTEM_PROMPTS[mode];
		const userPrompt = buildUserPrompt(mode, jdText, resumeText);
		const maxTokens =
			mode === "quick" ? 6000 : mode === "deep" ? 10000 : 8000;

		console.log(
			`[Worker] Calling Claude API for job ${job.id} (mode: ${mode})`,
		);

		// 5. Call Claude
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
			console.error(`[Worker] Job ${job.id} failed:`, result.error);
			await supabase.rpc("complete_job", {
				p_job_id: job.id,
				p_status: "failed",
				p_error_message:
					result.error?.slice(0, 2000) || "Generation failed",
			});
			return new Response(
				JSON.stringify({
					processed: true,
					jobId: job.id,
					status: "failed",
					error: result.error,
				}),
				{
					status: 200,
					headers: {
						...corsHeaders,
						"Content-Type": "application/json",
					},
				},
			);
		}

		// 7. Success - save result
		console.log(
			`[Worker] Job ${job.id} succeeded, latex length: ${result.latex.length}`,
		);
		await supabase.rpc("complete_job", {
			p_job_id: job.id,
			p_status: "succeeded",
			p_latex_text: result.latex,
		});

		return new Response(
			JSON.stringify({
				processed: true,
				jobId: job.id,
				status: "succeeded",
			}),
			{
				status: 200,
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			},
		);
	} catch (error) {
		console.error("[Worker] Unexpected error:", error);
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
