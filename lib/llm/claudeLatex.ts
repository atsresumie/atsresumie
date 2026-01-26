/**
 * Claude LaTeX Resume Generator
 *
 * Generates ATS-safe LaTeX resumes using Claude API with three modes:
 * - QUICK: Speed-optimized minimal changes
 * - DEEP: Deep tailoring with questionnaire answers
 * - SCRATCH: Build from structured profile data
 */

import Anthropic from "@anthropic-ai/sdk";
import {
	SYSTEM_PROMPT,
	QUICK_MODE_TEMPLATE,
	DEEP_MODE_TEMPLATE,
	SCRATCH_MODE_TEMPLATE,
} from "./prompts";

// ============================================
// TYPES
// ============================================

export type GenerationMode = "quick" | "deep" | "scratch";

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
	targetTitle: string;
	topStrengths: string;
	highlightRoles: string;
	highlightProjects: string;
	mustIncludeKeywords: string;
	locationPreference?: string;
}

export interface ScratchModeInputs {
	mode: "scratch";
	jdText: string;
	name: string;
	location: string;
	email: string;
	phone?: string;
	links?: string;
	targetTitle: string;
	summaryPoints?: string;
	skillsList: string;
	experienceEntries: string;
	projectEntries?: string;
	educationEntries?: string;
	certifications?: string;
}

export type GenerationInputs =
	| QuickModeInputs
	| DeepModeInputs
	| ScratchModeInputs;

export interface GenerationResult {
	success: boolean;
	latex?: string;
	error?: string;
}

// ============================================
// PROMPT BUILDERS
// ============================================

function buildQuickModePrompt(inputs: QuickModeInputs): string {
	return QUICK_MODE_TEMPLATE.replace("{{JD_TEXT}}", inputs.jdText)
		.replace("{{RESUME_TEXT}}", inputs.resumeText)
		.replace("{{TARGET_TITLE}}", inputs.targetTitle || "(not provided)");
}

function buildDeepModePrompt(inputs: DeepModeInputs): string {
	return DEEP_MODE_TEMPLATE.replace("{{JD_TEXT}}", inputs.jdText)
		.replace("{{RESUME_TEXT}}", inputs.resumeText)
		.replace("{{TARGET_TITLE}}", inputs.targetTitle)
		.replace("{{TOP_STRENGTHS}}", inputs.topStrengths)
		.replace("{{HIGHLIGHT_ROLES}}", inputs.highlightRoles)
		.replace("{{HIGHLIGHT_PROJECTS}}", inputs.highlightProjects)
		.replace("{{MUST_INCLUDE_KEYWORDS}}", inputs.mustIncludeKeywords)
		.replace(
			"{{LOCATION_PREFERENCE}}",
			inputs.locationPreference || "(not provided)",
		);
}

function buildScratchModePrompt(inputs: ScratchModeInputs): string {
	return SCRATCH_MODE_TEMPLATE.replace("{{JD_TEXT}}", inputs.jdText)
		.replace("{{NAME}}", inputs.name)
		.replace("{{LOCATION}}", inputs.location)
		.replace("{{EMAIL}}", inputs.email)
		.replace("{{PHONE}}", inputs.phone || "(not provided)")
		.replace("{{LINKS}}", inputs.links || "(not provided)")
		.replace("{{TARGET_TITLE}}", inputs.targetTitle)
		.replace("{{SUMMARY_POINTS}}", inputs.summaryPoints || "(not provided)")
		.replace("{{SKILLS_LIST}}", inputs.skillsList)
		.replace("{{EXPERIENCE_ENTRIES}}", inputs.experienceEntries)
		.replace(
			"{{PROJECT_ENTRIES}}",
			inputs.projectEntries || "(not provided)",
		)
		.replace(
			"{{EDUCATION_ENTRIES}}",
			inputs.educationEntries || "(not provided)",
		)
		.replace(
			"{{CERTIFICATIONS}}",
			inputs.certifications || "(not provided)",
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
 * @param inputs - Mode-specific inputs (quick, deep, or scratch)
 * @returns GenerationResult with success status and latex or error
 */
export async function generateLatexWithClaude(
	inputs: GenerationInputs,
): Promise<GenerationResult> {
	try {
		// Build the appropriate prompt based on mode
		let userPrompt: string;

		switch (inputs.mode) {
			case "quick":
				userPrompt = buildQuickModePrompt(inputs);
				break;
			case "deep":
				userPrompt = buildDeepModePrompt(inputs);
				break;
			case "scratch":
				userPrompt = buildScratchModePrompt(inputs);
				break;
			default:
				return {
					success: false,
					error: `Invalid mode: ${(inputs as any).mode}`,
				};
		}

		// Initialize Anthropic client
		const anthropic = getAnthropicClient();

		// Call Claude API
		const response = await anthropic.messages.create({
			model: "claude-sonnet-4-20250514",
			max_tokens: 8192,
			system: SYSTEM_PROMPT,
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
// VALIDATION HELPERS
// ============================================

export function validateQuickModeInputs(body: any): {
	valid: boolean;
	error?: string;
	inputs?: QuickModeInputs;
} {
	if (!body.jdText || typeof body.jdText !== "string") {
		return { valid: false, error: "Job description (jdText) is required" };
	}
	if (!body.resumeText || typeof body.resumeText !== "string") {
		return {
			valid: false,
			error: "Resume text is required for quick mode",
		};
	}

	return {
		valid: true,
		inputs: {
			mode: "quick",
			jdText: body.jdText,
			resumeText: body.resumeText,
			targetTitle: body.targetTitle,
		},
	};
}

export function validateDeepModeInputs(body: any): {
	valid: boolean;
	error?: string;
	inputs?: DeepModeInputs;
} {
	if (!body.jdText || typeof body.jdText !== "string") {
		return { valid: false, error: "Job description (jdText) is required" };
	}
	if (!body.resumeText || typeof body.resumeText !== "string") {
		return { valid: false, error: "Resume text is required for deep mode" };
	}
	if (!body.targetTitle || typeof body.targetTitle !== "string") {
		return {
			valid: false,
			error: "Target title is required for deep mode",
		};
	}
	if (!body.topStrengths || typeof body.topStrengths !== "string") {
		return {
			valid: false,
			error: "Top strengths are required for deep mode",
		};
	}
	if (!body.highlightRoles || typeof body.highlightRoles !== "string") {
		return {
			valid: false,
			error: "Highlight roles are required for deep mode",
		};
	}
	if (!body.highlightProjects || typeof body.highlightProjects !== "string") {
		return {
			valid: false,
			error: "Highlight projects are required for deep mode",
		};
	}
	if (
		!body.mustIncludeKeywords ||
		typeof body.mustIncludeKeywords !== "string"
	) {
		return {
			valid: false,
			error: "Must-include keywords are required for deep mode",
		};
	}

	return {
		valid: true,
		inputs: {
			mode: "deep",
			jdText: body.jdText,
			resumeText: body.resumeText,
			targetTitle: body.targetTitle,
			topStrengths: body.topStrengths,
			highlightRoles: body.highlightRoles,
			highlightProjects: body.highlightProjects,
			mustIncludeKeywords: body.mustIncludeKeywords,
			locationPreference: body.locationPreference,
		},
	};
}

export function validateScratchModeInputs(body: any): {
	valid: boolean;
	error?: string;
	inputs?: ScratchModeInputs;
} {
	if (!body.jdText || typeof body.jdText !== "string") {
		return { valid: false, error: "Job description (jdText) is required" };
	}
	if (!body.name || typeof body.name !== "string") {
		return { valid: false, error: "Name is required for scratch mode" };
	}
	if (!body.location || typeof body.location !== "string") {
		return { valid: false, error: "Location is required for scratch mode" };
	}
	if (!body.email || typeof body.email !== "string") {
		return { valid: false, error: "Email is required for scratch mode" };
	}
	if (!body.targetTitle || typeof body.targetTitle !== "string") {
		return {
			valid: false,
			error: "Target title is required for scratch mode",
		};
	}
	if (!body.skillsList || typeof body.skillsList !== "string") {
		return {
			valid: false,
			error: "Skills list is required for scratch mode",
		};
	}
	if (!body.experienceEntries || typeof body.experienceEntries !== "string") {
		return {
			valid: false,
			error: "Experience entries are required for scratch mode",
		};
	}

	return {
		valid: true,
		inputs: {
			mode: "scratch",
			jdText: body.jdText,
			name: body.name,
			location: body.location,
			email: body.email,
			phone: body.phone,
			links: body.links,
			targetTitle: body.targetTitle,
			summaryPoints: body.summaryPoints,
			skillsList: body.skillsList,
			experienceEntries: body.experienceEntries,
			projectEntries: body.projectEntries,
			educationEntries: body.educationEntries,
			certifications: body.certifications,
		},
	};
}
