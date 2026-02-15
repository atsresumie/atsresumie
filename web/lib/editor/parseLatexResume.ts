/**
 * Extract readable text content from LaTeX resume
 * This is loose extraction, not full LaTeX parsing
 */

import type {
	RenderPayload,
	ResumeSection,
	ResumeSectionItem,
} from "@/types/editor";

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
			// Handle href
			.replace(/\\href\{[^}]*\}\{([^}]*)\}/g, "$1")
			// Handle spacing
			.replace(/\\hspace\{[^}]*\}/g, " ")
			.replace(/\\vspace\{[^}]*\}/g, "\n")
			.replace(/\\\\(?:\[[^\]]*\])?/g, "\n")
			.replace(/\\newline/g, "\n")
			// Remove remaining simple commands
			.replace(/\\[a-zA-Z]+\*?(?:\[[^\]]*\])?(?:\{[^}]*\})?/g, "")
			// Clean up braces
			.replace(/\{|\}/g, "")
			// Clean up whitespace
			.replace(/[ \t]+/g, " ")
			.replace(/\n\s*\n/g, "\n")
			.trim()
	);
}

/**
 * Extract sections from LaTeX document
 */
function extractSections(latex: string): ResumeSection[] {
	const sections: ResumeSection[] = [];

	// Match \section{...} or \section*{...}
	const sectionRegex =
		/\\section\*?\{([^}]+)\}([\s\S]*?)(?=\\section|\\end\{document\}|$)/g;
	let match;

	while ((match = sectionRegex.exec(latex)) !== null) {
		const heading = stripLatexCommands(match[1]).trim();
		const content = match[2];

		const items = extractSectionItems(content);

		if (heading && items.length > 0) {
			sections.push({
				id: `section-${sections.length}`,
				heading: heading.toUpperCase(),
				items,
			});
		}
	}

	return sections;
}

/**
 * Extract items from section content (bullets, paragraphs, entries)
 */
function extractSectionItems(content: string): ResumeSectionItem[] {
	const items: ResumeSectionItem[] = [];

	// Check for itemize/enumerate environments
	const listRegex =
		/\\begin\{(?:itemize|enumerate)\}([\s\S]*?)\\end\{(?:itemize|enumerate)\}/g;
	const entryRegex =
		/\\resumeSubheading\{([^}]*)\}\{([^}]*)\}\{([^}]*)\}\{([^}]*)\}/g;
	const itemRegex = /\\item\s*([\s\S]*?)(?=\\item|\\end\{|$)/g;

	let listMatch;
	let hasLists = false;

	// Extract resume entries (common LaTeX resume format)
	let entryMatch;
	while ((entryMatch = entryRegex.exec(content)) !== null) {
		hasLists = true;
		const title = stripLatexCommands(entryMatch[1]);
		const meta = stripLatexCommands(entryMatch[2]);
		const subtitle = stripLatexCommands(entryMatch[3]);
		// entryMatch[4] is typically location/date

		items.push({
			type: "bullets",
			title,
			subtitle,
			meta,
			bullets: [],
		});
	}

	// Extract itemize lists
	while ((listMatch = listRegex.exec(content)) !== null) {
		hasLists = true;
		const listContent = listMatch[1];
		const bullets: string[] = [];

		let itemMatch;
		while ((itemMatch = itemRegex.exec(listContent)) !== null) {
			const bulletText = stripLatexCommands(itemMatch[1]).trim();
			if (bulletText) {
				bullets.push(bulletText);
			}
		}

		if (bullets.length > 0) {
			// If we have a previous entry with empty bullets, add to it
			const lastItem = items[items.length - 1];
			if (
				lastItem &&
				lastItem.type === "bullets" &&
				lastItem.bullets.length === 0
			) {
				lastItem.bullets = bullets;
			} else {
				items.push({ type: "bullets", bullets });
			}
		}
	}

	// If no lists found, treat as paragraph
	if (!hasLists) {
		const text = stripLatexCommands(content).trim();
		if (text) {
			items.push({ type: "paragraph", text });
		}
	}

	return items;
}

/**
 * Extract name/contact info from LaTeX header
 */
function extractHeader(latex: string): {
	name: string;
	subtitle?: string;
	contacts: string[];
} {
	let name = "Resume";
	const contacts: string[] = [];

	// Try to find name from common patterns
	const namePatterns = [
		/\\name\{([^}]+)\}/,
		/\\begin\{center\}\s*\\textbf\{\\Huge\s*([^}]+)\}/,
		/\\begin\{center\}\s*\{\\Huge\s*\\textbf\{([^}]+)\}/,
		/\\textbf\{\\huge\s*([^}]+)\}/,
		/\\Huge\s*\\textbf\{([^}]+)\}/,
	];

	for (const pattern of namePatterns) {
		const match = latex.match(pattern);
		if (match) {
			name = stripLatexCommands(match[1]).trim();
			break;
		}
	}

	// Extract email
	const emailMatch = latex.match(/\\href\{mailto:([^}]+)\}/);
	if (emailMatch) {
		contacts.push(emailMatch[1]);
	}

	// Extract phone
	const phoneMatch = latex.match(/\\small\s*([\d\-\(\)\s]+)/);
	if (phoneMatch && phoneMatch[1].replace(/\D/g, "").length >= 10) {
		contacts.push(phoneMatch[1].trim());
	}

	// Extract LinkedIn
	const linkedinMatch = latex.match(/linkedin\.com\/in\/([^\s\\}]+)/i);
	if (linkedinMatch) {
		contacts.push(`linkedin.com/in/${linkedinMatch[1]}`);
	}

	return { name, contacts };
}

/**
 * Parse LaTeX resume into RenderPayload
 */
export function parseLatexResume(latex: string): RenderPayload {
	const header = extractHeader(latex);
	const sections = extractSections(latex);

	// If no sections extracted, create a fallback
	if (sections.length === 0) {
		const cleanText = stripLatexCommands(latex);
		sections.push({
			id: "section-0",
			heading: "CONTENT",
			items: [{ type: "paragraph", text: cleanText }],
		});
	}

	return {
		title: header,
		sections,
	};
}
