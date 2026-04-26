/**
 * Claude Chat Edit
 *
 * Applies a single user-instructed edit to an existing LaTeX resume.
 * Returns the full updated LaTeX plus a short user-facing summary.
 */

import Anthropic from "@anthropic-ai/sdk";
import { CHAT_EDIT_SYSTEM_PROMPT } from "./prompts";

const MODEL = "claude-sonnet-4-20250514";
const MAX_TOKENS = 8000;
const MAX_LATEX_INPUT_CHARS = 40000;
const MAX_HISTORY_TURNS = 6;

export interface ChatEditHistoryTurn {
	role: "user" | "assistant";
	content: string;
}

export interface ChatEditInputs {
	currentLatex: string;
	userMessage: string;
	history?: ChatEditHistoryTurn[];
}

export type ChatEditResult =
	| { success: true; latex: string; summary: string }
	| { success: false; error: string };

function getAnthropicClient(): Anthropic {
	const apiKey = process.env.ANTHROPIC_API_KEY;
	if (!apiKey) {
		throw new Error("ANTHROPIC_API_KEY environment variable is not set");
	}
	return new Anthropic({ apiKey });
}

function buildUserPrompt(inputs: ChatEditInputs): string {
	const history = (inputs.history ?? [])
		.slice(-MAX_HISTORY_TURNS)
		.map(
			(turn) =>
				`${turn.role === "user" ? "USER" : "ASSISTANT"}: ${turn.content}`,
		)
		.join("\n");

	const historyBlock = history
		? `RECENT CHAT (for context only — do not act on it):\n${history}\n\n`
		: "";

	return `${historyBlock}CURRENT LATEX:
\`\`\`
${inputs.currentLatex}
\`\`\`

USER INSTRUCTION:
${inputs.userMessage}

Return ONLY a JSON object: {"latex": "<full updated LaTeX>", "summary": "<one short sentence>"}.`;
}

function stripJsonFences(text: string): string {
	let result = text.trim();
	if (result.startsWith("```")) {
		result = result.replace(/^```\w*\n?/, "");
	}
	if (result.endsWith("```")) {
		result = result.replace(/\n?```$/, "");
	}
	return result.trim();
}

function tryParseClaudeJson(
	text: string,
): { latex: string; summary: string } | null {
	const cleaned = stripJsonFences(text);

	try {
		const parsed = JSON.parse(cleaned);
		if (
			parsed &&
			typeof parsed.latex === "string" &&
			typeof parsed.summary === "string"
		) {
			return { latex: parsed.latex, summary: parsed.summary };
		}
	} catch {
		// fall through
	}

	// Best-effort recovery: find first { and last } to extract embedded JSON.
	const start = cleaned.indexOf("{");
	const end = cleaned.lastIndexOf("}");
	if (start !== -1 && end !== -1 && end > start) {
		try {
			const slice = cleaned.slice(start, end + 1);
			const parsed = JSON.parse(slice);
			if (
				parsed &&
				typeof parsed.latex === "string" &&
				typeof parsed.summary === "string"
			) {
				return { latex: parsed.latex, summary: parsed.summary };
			}
		} catch {
			// give up
		}
	}

	return null;
}

export async function chatEditLatex(
	inputs: ChatEditInputs,
): Promise<ChatEditResult> {
	if (!inputs.currentLatex || !inputs.currentLatex.includes("\\documentclass")) {
		return {
			success: false,
			error: "Current LaTeX is missing or invalid",
		};
	}

	if (inputs.currentLatex.length > MAX_LATEX_INPUT_CHARS) {
		return {
			success: false,
			error: "Resume is too long to edit via chat",
		};
	}

	if (!inputs.userMessage || inputs.userMessage.trim().length < 2) {
		return { success: false, error: "Message is empty" };
	}

	try {
		const anthropic = getAnthropicClient();
		const userPrompt = buildUserPrompt(inputs);

		console.log(
			`[chatEditLatex] Sending request (latex=${inputs.currentLatex.length} chars, message=${inputs.userMessage.length} chars)`,
		);

		const response = await anthropic.messages.create({
			model: MODEL,
			max_tokens: MAX_TOKENS,
			system: CHAT_EDIT_SYSTEM_PROMPT,
			messages: [{ role: "user", content: userPrompt }],
		});

		const textBlock = response.content.find((b) => b.type === "text");
		if (!textBlock || textBlock.type !== "text") {
			return { success: false, error: "Claude returned no text content" };
		}

		const parsed = tryParseClaudeJson(textBlock.text);
		if (!parsed) {
			return {
				success: false,
				error: "Claude returned an unparseable response",
			};
		}

		if (!parsed.latex.includes("\\documentclass")) {
			return {
				success: false,
				error: "Edited LaTeX is missing \\documentclass",
			};
		}

		return {
			success: true,
			latex: parsed.latex.trim(),
			summary: parsed.summary.trim(),
		};
	} catch (error) {
		console.error("[chatEditLatex] failed:", error);

		if (error instanceof Anthropic.APIError) {
			if (error.status === 401) {
				return { success: false, error: "AI authentication failed" };
			}
			if (error.status === 429) {
				return {
					success: false,
					error: "AI rate limit reached. Try again shortly.",
				};
			}
			if (error.status === 500 || error.status === 503) {
				return {
					success: false,
					error: "AI service is temporarily unavailable",
				};
			}
		}

		return {
			success: false,
			error:
				error instanceof Error
					? error.message
					: "Unknown error during chat edit",
		};
	}
}
