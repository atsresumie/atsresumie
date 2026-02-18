/**
 * Convert LaTeX resume content to clean, readable plain text.
 *
 * Rules:
 *  - Section headers in ALL CAPS
 *  - Bullets as "- "
 *  - One blank line between sections
 *  - No LaTeX commands remain
 */

// ---------------------------------------------------------------------------
// LaTeX stripping (mirrors & extends parseLatexResume.ts logic)
// ---------------------------------------------------------------------------

function stripLatexCommands(text: string): string {
	return (
		text
			// Remove comments
			.replace(/%.*$/gm, "")
			// Handle common formatting
			.replace(/\\textbf\{([^}]*)\}/g, "$1")
			.replace(/\\textit\{([^}]*)\}/g, "$1")
			.replace(/\\underline\{([^}]*)\}/g, "$1")
			.replace(/\\emph\{([^}]*)\}/g, "$1")
			.replace(/\\textsc\{([^}]*)\}/g, "$1")
			// Handle href – keep visible text
			.replace(/\\href\{[^}]*\}\{([^}]*)\}/g, "$1")
			// Handle spacing
			.replace(/\\hspace\{[^}]*\}/g, " ")
			.replace(/\\vspace\{[^}]*\}/g, "\n")
			.replace(/\\\\(?:\[[^\]]*\])?/g, "\n")
			.replace(/\\newline/g, "\n")
			// Pipe separator commonly used in resume headers
			.replace(/\\,?\|\\,?/g, " | ")
			.replace(/\\,/g, " ")
			// Remove remaining simple commands (keep content inside last braces group)
			.replace(/\\[a-zA-Z]+\*?(?:\[[^\]]*\])?(?:\{[^}]*\})?/g, "")
			// Clean up braces
			.replace(/\{|\}/g, "")
			// Clean up whitespace
			.replace(/[ \t]+/g, " ")
			.replace(/\n[ \t]+/g, "\n")
			.trim()
	);
}

// ---------------------------------------------------------------------------
// Section / bullet extraction
// ---------------------------------------------------------------------------

interface PlainSection {
	heading: string;
	lines: string[];
}

/**
 * Extract header block (name + contact) from LaTeX preamble.
 */
function extractHeaderBlock(latex: string): string[] {
	const lines: string[] = [];

	// Name
	const namePatterns = [
		/\\name\{([^}]+)\}/,
		/\\begin\{center\}\s*\\textbf\{\\Huge\s*([^}]+)\}/,
		/\\begin\{center\}\s*\{\\Huge\s*\\textbf\{([^}]+)\}/,
		/\\textbf\{\\huge\s*([^}]+)\}/,
		/\\Huge\s*\\textbf\{([^}]+)\}/,
	];
	for (const p of namePatterns) {
		const m = latex.match(p);
		if (m) {
			lines.push(stripLatexCommands(m[1]).trim().toUpperCase());
			break;
		}
	}

	// Contact line – gather email, phone, linkedin
	const contacts: string[] = [];

	const emailMatch = latex.match(/\\href\{mailto:([^}]+)\}/);
	if (emailMatch) contacts.push(emailMatch[1]);

	const phoneMatch = latex.match(/\\small\s*([\d\-\(\)\s+]+)/);
	if (phoneMatch && phoneMatch[1].replace(/\D/g, "").length >= 10) {
		contacts.push(phoneMatch[1].trim());
	}

	const linkedinMatch = latex.match(/linkedin\.com\/in\/([^\s\\}]+)/i);
	if (linkedinMatch) contacts.push(`linkedin.com/in/${linkedinMatch[1]}`);

	if (contacts.length > 0) {
		lines.push(contacts.join(" | "));
	}

	return lines;
}

/**
 * Extract sections (\\section{...}) and their content from a LaTeX document.
 */
function extractSections(latex: string): PlainSection[] {
	const sections: PlainSection[] = [];

	const sectionRegex =
		/\\section\*?\{([^}]+)\}([\s\S]*?)(?=\\section|\\end\{document\}|$)/g;

	let match;
	while ((match = sectionRegex.exec(latex)) !== null) {
		const heading = stripLatexCommands(match[1]).trim().toUpperCase();
		const body = match[2];
		const lines = extractContentLines(body);

		if (heading && lines.length > 0) {
			sections.push({ heading, lines });
		}
	}

	return sections;
}

/**
 * Extract lines from section body – handles itemize lists, resume entry macros,
 * and plain paragraphs.
 */
function extractContentLines(body: string): string[] {
	const lines: string[] = [];

	// Resume entry macros (common in Jake's template)
	const entryRegex =
		/\\resumeSubheading\{([^}]*)\}\{([^}]*)\}\{([^}]*)\}\{([^}]*)\}/g;
	let entryMatch;
	while ((entryMatch = entryRegex.exec(body)) !== null) {
		const title = stripLatexCommands(entryMatch[1]).trim();
		const date = stripLatexCommands(entryMatch[2]).trim();
		const subtitle = stripLatexCommands(entryMatch[3]).trim();
		const location = stripLatexCommands(entryMatch[4]).trim();

		const parts: string[] = [];
		if (title) parts.push(title);
		if (subtitle) parts.push(subtitle);
		if (location || date)
			parts.push([location, date].filter(Boolean).join(", "));
		if (parts.length > 0) lines.push(parts.join(" — "));
	}

	// Itemize / enumerate
	const listRegex =
		/\\begin\{(?:itemize|enumerate)\}([\s\S]*?)\\end\{(?:itemize|enumerate)\}/g;
	let listMatch;
	while ((listMatch = listRegex.exec(body)) !== null) {
		const itemRegex = /\\item\s*([\s\S]*?)(?=\\item|$)/g;
		let itemMatch;
		while ((itemMatch = itemRegex.exec(listMatch[1])) !== null) {
			const text = stripLatexCommands(itemMatch[1]).trim();
			if (text) lines.push(`- ${text}`);
		}
	}

	// If nothing structured found, fall back to plain text
	if (lines.length === 0) {
		const text = stripLatexCommands(body).trim();
		if (text) {
			// Split into paragraphs
			text.split(/\n{2,}/).forEach((p) => {
				const cleaned = p.replace(/\n/g, " ").trim();
				if (cleaned) lines.push(cleaned);
			});
		}
	}

	return lines;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Convert a LaTeX resume string to clean, ATS-friendly plain text.
 */
export function latexToPlainText(latex: string): string {
	const output: string[] = [];

	// Header block (name + contact)
	const headerLines = extractHeaderBlock(latex);
	if (headerLines.length > 0) {
		output.push(...headerLines, "");
	}

	// Sections
	const sections = extractSections(latex);
	for (const section of sections) {
		output.push(section.heading);
		output.push(...section.lines);
		output.push(""); // blank line between sections
	}

	// Fallback: if nothing extracted, do raw strip
	if (sections.length === 0 && headerLines.length === 0) {
		return stripLatexCommands(latex)
			.split(/\n{2,}/)
			.join("\n\n")
			.trim();
	}

	return output
		.join("\n")
		.replace(/\n{3,}/g, "\n\n")
		.trim();
}

/**
 * Sanitize a job label for use as a filename component.
 * Removes special chars, replaces spaces with underscores, caps at 60 chars.
 * Falls back to "Resume" if the result is empty.
 */
export function sanitizeLabel(label: string): string {
	const sanitized = label
		.replace(/[\/\\:*?"<>|]/g, "")
		.replace(/\s+/g, "_")
		.trim()
		.slice(0, 60);

	return sanitized || "Resume";
}

/**
 * Build the standard filename for a TXT export.
 * Pattern: ATSResumie_<label>_<YYYY-MM-DD>.txt
 */
export function buildTxtFilename(jobLabel: string): string {
	const label = sanitizeLabel(jobLabel);
	const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
	return `ATSResumie_${label}_${date}.txt`;
}

/**
 * Trigger browser download of a plain-text string.
 */
export function downloadTextFile(content: string, filename: string): void {
	const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}
