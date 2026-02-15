/**
 * Parse plain text resume into structured RenderPayload
 * Uses heuristics to identify sections, headings, and bullet points.
 */

import type {
	RenderPayload,
	ResumeSection,
	ResumeSectionItem,
} from "@/types/editor";

// Common resume section headings
const KNOWN_HEADINGS = [
	"SUMMARY",
	"PROFESSIONAL SUMMARY",
	"OBJECTIVE",
	"EXPERIENCE",
	"WORK EXPERIENCE",
	"PROFESSIONAL EXPERIENCE",
	"EMPLOYMENT",
	"EDUCATION",
	"SKILLS",
	"TECHNICAL SKILLS",
	"CORE COMPETENCIES",
	"CERTIFICATIONS",
	"PROJECTS",
	"AWARDS",
	"PUBLICATIONS",
	"LANGUAGES",
	"VOLUNTEER",
	"INTERESTS",
	"REFERENCES",
];

/**
 * Check if a line looks like a section heading
 */
function isHeading(line: string): boolean {
	const trimmed = line.trim();
	if (!trimmed) return false;

	// Check if it's a known heading (case insensitive)
	const upper = trimmed.toUpperCase();
	if (KNOWN_HEADINGS.some((h) => upper === h || upper.startsWith(h + ":"))) {
		return true;
	}

	// ALL CAPS line (at least 3 chars, mostly letters)
	if (
		trimmed.length >= 3 &&
		trimmed === trimmed.toUpperCase() &&
		/^[A-Z\s&]+$/.test(trimmed)
	) {
		return true;
	}

	// Ends with colon (common heading pattern)
	if (trimmed.endsWith(":") && trimmed.length < 50) {
		return true;
	}

	return false;
}

/**
 * Check if a line is a bullet point
 */
function isBullet(line: string): boolean {
	const trimmed = line.trim();
	return /^[•\-\*]\s/.test(trimmed);
}

/**
 * Extract bullet content (remove bullet marker)
 */
function extractBulletContent(line: string): string {
	return line.trim().replace(/^[•\-\*]\s*/, "");
}

/**
 * Parse contact info from lines (email, phone, linkedin, etc.)
 */
function extractContacts(lines: string[]): string[] {
	const contacts: string[] = [];
	const patterns = [
		/[\w.-]+@[\w.-]+\.\w+/, // email
		/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/, // phone
		/linkedin\.com\/in\/[\w-]+/i, // linkedin
		/github\.com\/[\w-]+/i, // github
	];

	for (const line of lines) {
		for (const pattern of patterns) {
			const match = line.match(pattern);
			if (match) {
				contacts.push(match[0]);
			}
		}
	}

	return contacts;
}

/**
 * Parse plain text resume into RenderPayload
 */
export function parseResumePlainText(text: string): RenderPayload {
	const lines = text.split("\n");
	const sections: ResumeSection[] = [];

	// Try to extract name from first non-empty line
	let name = "Resume";
	let subtitle = "";
	const contacts: string[] = [];
	let startIndex = 0;

	// Find name (usually first line)
	for (let i = 0; i < Math.min(5, lines.length); i++) {
		const line = lines[i].trim();
		if (line && !isHeading(line) && !isBullet(line)) {
			// First substantial line is likely the name
			if (!name || name === "Resume") {
				name = line;
				startIndex = i + 1;
				break;
			}
		}
	}

	// Extract contacts from header area
	const headerLines = lines.slice(0, Math.min(10, lines.length));
	contacts.push(...extractContacts(headerLines));

	// Parse sections
	let currentSection: ResumeSection | null = null;
	let currentBullets: string[] = [];
	let currentParagraph = "";

	const flushCurrentItem = () => {
		if (!currentSection) return;

		if (currentBullets.length > 0) {
			currentSection.items.push({
				type: "bullets",
				bullets: [...currentBullets],
			});
			currentBullets = [];
		}

		if (currentParagraph.trim()) {
			currentSection.items.push({
				type: "paragraph",
				text: currentParagraph.trim(),
			});
			currentParagraph = "";
		}
	};

	const flushCurrentSection = () => {
		flushCurrentItem();
		if (currentSection && currentSection.items.length > 0) {
			sections.push(currentSection);
		}
		currentSection = null;
	};

	for (let i = startIndex; i < lines.length; i++) {
		const line = lines[i];
		const trimmed = line.trim();

		// Skip empty lines
		if (!trimmed) {
			// Empty line might end a paragraph
			if (currentParagraph.trim()) {
				flushCurrentItem();
			}
			continue;
		}

		// Check for heading
		if (isHeading(trimmed)) {
			flushCurrentSection();
			currentSection = {
				id: `section-${sections.length}`,
				heading: trimmed.replace(/:$/, ""),
				items: [],
			};
			continue;
		}

		// If no current section, create a default one
		if (!currentSection) {
			currentSection = {
				id: `section-${sections.length}`,
				heading: "SUMMARY",
				items: [],
			};
		}

		// Check for bullet
		if (isBullet(trimmed)) {
			if (currentParagraph.trim()) {
				flushCurrentItem();
			}
			currentBullets.push(extractBulletContent(trimmed));
		} else {
			// Regular text - add to paragraph or bullets
			if (currentBullets.length > 0) {
				// Continuation of last bullet?
				if (line.startsWith("  ") || line.startsWith("\t")) {
					currentBullets[currentBullets.length - 1] += " " + trimmed;
				} else {
					flushCurrentItem();
					currentParagraph += trimmed + " ";
				}
			} else {
				currentParagraph += trimmed + " ";
			}
		}
	}

	// Flush remaining content
	flushCurrentSection();

	// If no sections found, wrap everything as summary
	if (sections.length === 0) {
		sections.push({
			id: "section-0",
			heading: "SUMMARY",
			items: [{ type: "paragraph", text: text.trim() }],
		});
	}

	return {
		title: { name, subtitle, contacts },
		sections,
	};
}
