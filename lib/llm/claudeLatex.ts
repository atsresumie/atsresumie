/**
 * Claude LaTeX Resume Generator
 *
 * Generates ATS-safe LaTeX resumes using Claude API with three modes:
 * - QUICK: Speed-optimized minimal changes (cheapest tokens)
 * - DEEP: Premium output with strict professional typesetting (more tokens)
 * - SCRATCH: Rebuild resume structure from resumeText (moderate tokens)
 *
 * All modes accept the same UI inputs: jdText + resumeText.
 * Missing fields are derived programmatically.
 */

import Anthropic from "@anthropic-ai/sdk";
import {
	SYSTEM_PROMPTS,
	QUICK_MODE_TEMPLATE,
	DEEP_MODE_TEMPLATE,
	SCRATCH_MODE_TEMPLATE,
} from "./prompts";

// ============================================
// TYPES
// ============================================

export type GenerationMode = "quick" | "deep" | "scratch";

/**
 * Unified inputs accepted from API - same for all modes.
 * All modes now use jdText + resumeText; no questionnaire fields.
 */
export interface UnifiedModeInputs {
	mode: GenerationMode;
	jdText: string;
	resumeText: string;
}

// Legacy types kept for backward compatibility
export interface QuickModeInputs {
	mode: "quick";
	jdText: string;
	resumeText: string;
	targetTitle?: string;
}

export interface DeepModeInputs {
	mode: "deep";
	jdText: string;
	resumeText: string;
	targetTitle?: string;
	mustIncludeKeywords?: string;
}

export interface ScratchModeInputs {
	mode: "scratch";
	jdText: string;
	resumeText: string;
}

export type GenerationInputs =
	| QuickModeInputs
	| DeepModeInputs
	| ScratchModeInputs
	| UnifiedModeInputs;

export interface GenerationResult {
	success: boolean;
	latex?: string;
	error?: string;
}

// ============================================
// TOKEN LIMITS (safeguards against bloat)
// ============================================

const TOKEN_LIMITS = {
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

// ============================================
// DERIVE FUNCTIONS (extract missing fields)
// ============================================

/**
 * Extract target title from JD text using pattern matching.
 * Returns empty string if not found (prompt will handle gracefully).
 */
function deriveTargetTitle(jdText: string): string {
	// Common patterns for job titles
	const patterns = [
		/(?:job\s*title|position|role)\s*[:\-]\s*(.+)/i,
		/(?:we\s*(?:are|'re)\s*(?:looking|hiring)\s*(?:for|a)\s*)(.+?)(?:\.|,|to\s+join)/i,
		/^(.+?(?:engineer|developer|manager|analyst|designer|architect|lead|specialist|consultant|coordinator|director|vp|head))/im,
	];

	for (const pattern of patterns) {
		const match = jdText.match(pattern);
		if (match && match[1]) {
			// Clean up and return first 80 chars max
			return match[1].trim().slice(0, 80);
		}
	}

	// Fallback: check first non-empty line
	const firstLine = jdText.split("\n").find((l) => l.trim().length > 5);
	if (firstLine && firstLine.length < 100) {
		return firstLine.trim();
	}

	return "";
}

/**
 * Extract keywords from JD text deterministically (no LLM call).
 * Picks 10-15 relevant terms for the DEEP mode prompt.
 */
function deriveKeywords(jdText: string): string {
	const lowerJd = jdText.toLowerCase();

	// Common tech keywords to look for
	const techKeywords = [
		// Languages
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
		// Frameworks/Libraries
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
		// Databases
		"sql",
		"postgresql",
		"mysql",
		"mongodb",
		"redis",
		"elasticsearch",
		"dynamodb",
		// Cloud/DevOps
		"aws",
		"azure",
		"gcp",
		"docker",
		"kubernetes",
		"terraform",
		"jenkins",
		"ci/cd",
		"github actions",
		// Concepts
		"microservices",
		"rest api",
		"graphql",
		"agile",
		"scrum",
		"tdd",
		"machine learning",
		"ai",
		"data science",
		// Soft skills
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

	// Also extract years of experience patterns
	const expMatch = jdText.match(/(\d+\+?\s*years?)/gi);
	if (expMatch) {
		foundKeywords.push(...expMatch.slice(0, 2));
	}

	return foundKeywords.join(", ");
}

// ============================================
// PROMPT BUILDERS
// ============================================

function buildQuickModePrompt(jdText: string, resumeText: string): string {
	return QUICK_MODE_TEMPLATE.replace("{{JD_TEXT}}", jdText).replace(
		"{{RESUME_TEXT}}",
		resumeText,
	);
}

function buildDeepModePrompt(jdText: string, resumeText: string): string {
	const targetTitle = deriveTargetTitle(jdText);
	const keywords = deriveKeywords(jdText);

	return DEEP_MODE_TEMPLATE.replace("{{JD_TEXT}}", jdText)
		.replace("{{RESUME_TEXT}}", resumeText)
		.replace("{{TARGET_TITLE}}", targetTitle || "(infer from JD)")
		.replace("{{MUST_INCLUDE_KEYWORDS}}", keywords || "(extract from JD)");
}

function buildScratchModePrompt(jdText: string, resumeText: string): string {
	return SCRATCH_MODE_TEMPLATE.replace("{{JD_TEXT}}", jdText).replace(
		"{{RESUME_TEXT}}",
		resumeText,
	);
}

// ============================================
// CLAUDE API CLIENT
// ============================================

function getAnthropicClient(): Anthropic {
	const apiKey = process.env.ANTHROPIC_API_KEY;
	if (!apiKey) {
		throw new Error("ANTHROPIC_API_KEY environment variable is not set");
	}
	return new Anthropic({ apiKey });
}

// ============================================
// MAIN GENERATION FUNCTION
// ============================================

/**
 * Generate LaTeX resume using Claude API
 *
 * @param inputs - Mode + jdText + resumeText (all modes use same inputs)
 * @returns GenerationResult with success status and latex or error
 */
export async function generateLatexWithClaude(
	inputs: GenerationInputs,
): Promise<GenerationResult> {
	try {
		const mode = inputs.mode;

		// Get mode-specific limits and apply truncation
		const limits = TOKEN_LIMITS[mode];
		const jdText = truncateText(inputs.jdText, limits.jdText);
		const resumeText = truncateText(inputs.resumeText, limits.resumeText);

		// Select system prompt based on mode
		const systemPrompt = SYSTEM_PROMPTS[mode];

		// Build mode-specific user prompt
		let userPrompt: string;
		switch (mode) {
			case "quick":
				userPrompt = buildQuickModePrompt(jdText, resumeText);
				break;
			case "deep":
				userPrompt = buildDeepModePrompt(jdText, resumeText);
				break;
			case "scratch":
				userPrompt = buildScratchModePrompt(jdText, resumeText);
				break;
			default:
				return {
					success: false,
					error: `Invalid mode: ${(inputs as GenerationInputs).mode}`,
				};
		}

		// Initialize Anthropic client
		const anthropic = getAnthropicClient();

		// Adjust max_tokens based on mode
		const maxTokens =
			mode === "quick" ? 6000 : mode === "deep" ? 10000 : 8000;

		console.log(
			`[Claude] Generating LaTeX with mode=${mode}, systemPrompt=${systemPrompt.length} chars, userPrompt=${userPrompt.length} chars`,
		);

		// Call Claude API with mode-specific system prompt
		const response = await anthropic.messages.create({
			model: "claude-sonnet-4-20250514",
			max_tokens: maxTokens,
			system: systemPrompt,
			messages: [
				{
					role: "user",
					content: userPrompt,
				},
			],
		});

		// Extract text from response
		const textBlock = response.content.find(
			(block) => block.type === "text",
		);
		if (!textBlock || textBlock.type !== "text") {
			return {
				success: false,
				error: "Claude returned no text content",
			};
		}

		const latex = textBlock.text.trim();

		// Basic validation: check for \documentclass
		if (!latex || !latex.includes("\\documentclass")) {
			return {
				success: false,
				error: "Generated output does not appear to be valid LaTeX (missing \\documentclass)",
			};
		}

		// Clean up any markdown fences if present
		let cleanedLatex = latex;
		if (cleanedLatex.startsWith("```")) {
			cleanedLatex = cleanedLatex.replace(/^```\w*\n?/, "");
		}
		if (cleanedLatex.endsWith("```")) {
			cleanedLatex = cleanedLatex.replace(/\n?```$/, "");
		}

		return {
			success: true,
			latex: cleanedLatex.trim(),
		};
	} catch (error) {
		console.error("Claude LaTeX generation failed:", error);

		// Handle specific Anthropic errors
		if (error instanceof Anthropic.APIError) {
			if (error.status === 401) {
				return {
					success: false,
					error: "Claude API authentication failed",
				};
			}
			if (error.status === 429) {
				return {
					success: false,
					error: "Claude API rate limit exceeded. Please try again shortly.",
				};
			}
			if (error.status === 500 || error.status === 503) {
				return {
					success: false,
					error: "Claude API is temporarily unavailable. Please try again.",
				};
			}
		}

		return {
			success: false,
			error:
				error instanceof Error
					? error.message
					: "Unknown error during generation",
		};
	}
}

// ============================================
// VALIDATION (Simplified - all modes same inputs)
// ============================================

export interface ValidationResult {
	valid: boolean;
	fieldErrors?: Record<string, string>;
	inputs?: UnifiedModeInputs;
}

/**
 * Validate inputs for any mode. All modes require jdText + resumeText.
 */
export function validateModeInputs(
	body: Record<string, unknown>,
): ValidationResult {
	const fieldErrors: Record<string, string> = {};

	// Validate mode
	const validModes = ["quick", "deep", "scratch"];
	const mode = body.mode as string | undefined;
	if (!mode || !validModes.includes(mode)) {
		fieldErrors.mode = "Mode must be one of: quick, deep, scratch";
	}

	// Validate jdText
	const jdText = body.jdText as string | undefined;
	if (!jdText || typeof jdText !== "string") {
		fieldErrors.jdText = "Job description is required";
	} else if (jdText.trim().length < 50) {
		fieldErrors.jdText = "Job description must be at least 50 characters";
	}

	// Validate resumeText
	const resumeText = body.resumeText as string | undefined;
	if (!resumeText || typeof resumeText !== "string") {
		fieldErrors.resumeText = "Resume text is required";
	} else if (resumeText.trim().length < 100) {
		fieldErrors.resumeText = "Resume text must be at least 100 characters";
	}

	if (Object.keys(fieldErrors).length > 0) {
		return { valid: false, fieldErrors };
	}

	return {
		valid: true,
		inputs: {
			mode: (body.mode as GenerationMode) || "quick",
			jdText: (body.jdText as string).trim(),
			resumeText: (body.resumeText as string).trim(),
		},
	};
}

// ============================================
// LEGACY VALIDATION (for backward compatibility)
// ============================================

export function validateQuickModeInputs(body: Record<string, unknown>): {
	valid: boolean;
	error?: string;
	inputs?: QuickModeInputs;
} {
	const result = validateModeInputs({ ...body, mode: "quick" });
	if (!result.valid) {
		return {
			valid: false,
			error: Object.values(result.fieldErrors || {}).join(", "),
		};
	}
	return {
		valid: true,
		inputs: {
			mode: "quick",
			jdText: result.inputs!.jdText,
			resumeText: result.inputs!.resumeText,
		},
	};
}

export function validateDeepModeInputs(body: Record<string, unknown>): {
	valid: boolean;
	error?: string;
	inputs?: DeepModeInputs;
} {
	const result = validateModeInputs({ ...body, mode: "deep" });
	if (!result.valid) {
		return {
			valid: false,
			error: Object.values(result.fieldErrors || {}).join(", "),
		};
	}
	return {
		valid: true,
		inputs: {
			mode: "deep",
			jdText: result.inputs!.jdText,
			resumeText: result.inputs!.resumeText,
		},
	};
}

export function validateScratchModeInputs(body: Record<string, unknown>): {
	valid: boolean;
	error?: string;
	inputs?: ScratchModeInputs;
} {
	const result = validateModeInputs({ ...body, mode: "scratch" });
	if (!result.valid) {
		return {
			valid: false,
			error: Object.values(result.fieldErrors || {}).join(", "),
		};
	}
	return {
		valid: true,
		inputs: {
			mode: "scratch",
			jdText: result.inputs!.jdText,
			resumeText: result.inputs!.resumeText,
		},
	};
}
