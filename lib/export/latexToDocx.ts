/**
 * Convert LaTeX resume content to a professional DOCX document.
 *
 * Reuses parsing from latexToPlainText.ts and generates a structured
 * Word document using the `docx` library.
 *
 * The LLM generates standard LaTeX (not Jake's Resume template), so we
 * parse: \textbf{Title} \hfill Date, \textit{Sub} \hfill Loc, \item bullets,
 * and plain paragraphs.
 */

import {
	Document,
	Paragraph,
	TextRun,
	AlignmentType,
	HeadingLevel,
	BorderStyle,
	TabStopPosition,
	TabStopType,
	Packer,
} from "docx";
import { saveAs } from "file-saver";
import {
	stripLatexCommands,
	extractHeaderBlock,
	sanitizeLabel,
} from "./latexToPlainText";
import { parseStyleFromLatex } from "@/lib/latex/applyStyleToLatex";
import type { LaTeXFontFamily } from "@/types/editor";

// ---------------------------------------------------------------------------
// LaTeX section extraction (specialized for DOCX)
// ---------------------------------------------------------------------------

interface DocxSection {
	heading: string;
	/** Raw LaTeX body for this section */
	body: string;
}

/**
 * Extract sections from LaTeX.
 * Handles both \section{...} and custom \sectionheader{...} macros.
 */
function extractDocxSections(latex: string): DocxSection[] {
	const sections: DocxSection[] = [];

	// Match \section{...}, \section*{...}, or \sectionheader{...}
	const sectionRegex =
		/\\(?:section\*?|sectionheader)\{([^}]+)\}([\s\S]*?)(?=\\(?:section\*?|sectionheader)\{|\\end\{document\}|$)/g;

	let match;
	while ((match = sectionRegex.exec(latex)) !== null) {
		const heading = stripLatexCommands(match[1]).trim().toUpperCase();
		const body = match[2];

		if (heading) {
			sections.push({ heading, body });
		}
	}

	return sections;
}

// ---------------------------------------------------------------------------
// Body parsing: extract entries, bullets, and paragraphs
// ---------------------------------------------------------------------------

interface ParsedBody {
	/** Interleaved content in document order */
	elements: BodyElement[];
}

type BodyElement =
	| { type: "entry"; title: string; right: string }
	| { type: "subentry"; title: string; right: string }
	| { type: "bullet"; text: string }
	| { type: "paragraph"; text: string };

/**
 * Parse a section body into ordered elements for DOCX output.
 *
 * Handles:
 * - \resumeSubheading{title}{date}{subtitle}{location}
 * - \textbf{Title} \hfill Date (entry line)
 * - \textit{Subtitle} \hfill Location (sub-entry)
 * - \item bullets inside itemize/enumerate
 * - Plain text paragraphs
 */
function parseSectionBody(body: string): ParsedBody {
	const elements: BodyElement[] = [];

	// Work line-by-line for structured parsing
	// First, handle \resumeSubheading macro (fallback for Jake's template)
	const subheadingRegex =
		/\\resumeSubheading\{([^}]*)\}\{([^}]*)\}\{([^}]*)\}\{([^}]*)\}/g;
	let subMatch;
	const subheadingRanges: [number, number][] = [];
	while ((subMatch = subheadingRegex.exec(body)) !== null) {
		const title = stripLatexCommands(subMatch[1]).trim();
		const date = stripLatexCommands(subMatch[2]).trim();
		const subtitle = stripLatexCommands(subMatch[3]).trim();
		const location = stripLatexCommands(subMatch[4]).trim();

		if (title || subtitle) {
			elements.push({
				type: "entry",
				title: title || subtitle,
				right: date,
			});
			if (subtitle && title) {
				elements.push({
					type: "subentry",
					title: subtitle,
					right: location,
				});
			}
		}
		subheadingRanges.push([
			subMatch.index,
			subMatch.index + subMatch[0].length,
		]);
	}

	// Extract \textbf{...} \hfill ... patterns (entry lines)
	// These are outside of itemize environments
	const entryLineRegex =
		/\\textbf\{([^}]+)\}\s*\\hfill\s*(.*?)(?:\s*\\\\|$)/gm;
	let entryMatch;
	const entryRanges: [number, number][] = [];
	while ((entryMatch = entryLineRegex.exec(body)) !== null) {
		// Skip if inside a subheading range
		const pos = entryMatch.index;
		if (subheadingRanges.some(([s, e]) => pos >= s && pos < e)) continue;

		const title = stripLatexCommands(entryMatch[1]).trim();
		const right = stripLatexCommands(entryMatch[2]).trim();

		if (title) {
			elements.push({ type: "entry", title, right });
		}
		entryRanges.push([
			entryMatch.index,
			entryMatch.index + entryMatch[0].length,
		]);
	}

	// Extract \textit{...} \hfill ... patterns (sub-entry lines)
	const subEntryRegex =
		/\\textit\{([^}]+)\}\s*\\hfill\s*(.*?)(?:\s*\\\\|$)/gm;
	let subEntryMatch;
	while ((subEntryMatch = subEntryRegex.exec(body)) !== null) {
		const pos = subEntryMatch.index;
		if (subheadingRanges.some(([s, e]) => pos >= s && pos < e)) continue;
		if (entryRanges.some(([s, e]) => pos >= s && pos < e)) continue;

		const title = stripLatexCommands(subEntryMatch[1]).trim();
		const right = stripLatexCommands(subEntryMatch[2]).trim();

		if (title) {
			elements.push({ type: "subentry", title, right });
		}
	}

	// Extract bullets from itemize/enumerate
	const listRegex =
		/\\begin\{(?:itemize|enumerate)\}([\s\S]*?)\\end\{(?:itemize|enumerate)\}/g;
	let listMatch;
	while ((listMatch = listRegex.exec(body)) !== null) {
		const itemRegex = /\\item\s*([\s\S]*?)(?=\\item|$)/g;
		let itemMatch;
		while ((itemMatch = itemRegex.exec(listMatch[1])) !== null) {
			const text = stripLatexCommands(itemMatch[1]).trim();
			if (text) {
				elements.push({ type: "bullet", text });
			}
		}
	}

	// If nothing structured found, fall back to plain text paragraphs
	if (elements.length === 0) {
		const text = stripLatexCommands(body).trim();
		if (text) {
			text.split(/\n{2,}/).forEach((p) => {
				const cleaned = p
					.replace(/\n/g, " ")
					.replace(/\s+/g, " ")
					.trim();
				if (cleaned) {
					elements.push({ type: "paragraph", text: cleaned });
				}
			});
		}
	}

	return { elements };
}

// ---------------------------------------------------------------------------
// Style extraction from LaTeX
// ---------------------------------------------------------------------------

/** Resolved style values for DOCX generation */
interface DocxStyle {
	font: string;
	/** Half-point values for DOCX (e.g. 22 = 11pt) */
	baseSizeHp: number;
	headingSizeHp: number;
	nameSizeHp: number;
	contactSizeHp: number;
	lineSpacing: number; // DOCX line spacing in 240ths of a line
	marginTopMm: number;
	marginBottomMm: number;
	marginLeftMm: number;
	marginRightMm: number;
}

/** Map LaTeX font family names to DOCX-compatible font names */
const LATEX_TO_DOCX_FONT: Record<LaTeXFontFamily, string> = {
	default: "Computer Modern",
	lmodern: "Latin Modern Roman",
	times: "Times New Roman",
	helvetica: "Helvetica",
	palatino: "Palatino Linotype",
	charter: "Charter",
	bookman: "Bookman Old Style",
};

/** Convert mm to DOCX twips (1 mm ≈ 56.7 twips) */
function mmToTwip(mm: number): number {
	return Math.round(mm * 56.693);
}

/**
 * Extract DOCX style from LaTeX source.
 * Falls back to sensible defaults if parsing fails.
 */
function extractDocxStyle(latex: string): DocxStyle {
	const parsed = parseStyleFromLatex(latex);

	const font = LATEX_TO_DOCX_FONT[parsed.fontFamily] || "Calibri";
	const basePt = parsed.baseFontSizePt || 11;
	const baseSizeHp = basePt * 2; // half-points

	// DOCX line spacing: 240 = single, 360 = 1.5, 480 = double
	const lineSpacing = Math.round((parsed.lineHeight || 1.0) * 240);

	return {
		font,
		baseSizeHp,
		headingSizeHp: Math.round(basePt * 1.1) * 2, // ~10% larger
		nameSizeHp: Math.round(basePt * 2.2) * 2, // ~2x larger
		contactSizeHp: Math.round(basePt * 0.9) * 2, // ~10% smaller
		lineSpacing,
		marginTopMm: parsed.marginTopMm,
		marginBottomMm: parsed.marginBottomMm,
		marginLeftMm: parsed.marginLeftMm,
		marginRightMm: parsed.marginRightMm,
	};
}

// ---------------------------------------------------------------------------
// DOCX Document Building
// ---------------------------------------------------------------------------

const COLOR_DARK = "333333";
const COLOR_GRAY = "666666";

function buildNameParagraph(name: string, s: DocxStyle): Paragraph {
	return new Paragraph({
		alignment: AlignmentType.CENTER,
		spacing: { after: 40, line: s.lineSpacing },
		children: [
			new TextRun({
				text: name,
				bold: true,
				size: s.nameSizeHp,
				font: s.font,
				color: COLOR_DARK,
			}),
		],
	});
}

function buildContactParagraph(contact: string, s: DocxStyle): Paragraph {
	return new Paragraph({
		alignment: AlignmentType.CENTER,
		spacing: { after: 200, line: s.lineSpacing },
		children: [
			new TextRun({
				text: contact,
				size: s.contactSizeHp,
				font: s.font,
				color: COLOR_GRAY,
			}),
		],
	});
}

function buildSectionHeading(title: string, s: DocxStyle): Paragraph {
	return new Paragraph({
		heading: HeadingLevel.HEADING_2,
		spacing: { before: 240, after: 80, line: s.lineSpacing },
		border: {
			bottom: {
				style: BorderStyle.SINGLE,
				size: 1,
				color: "999999",
			},
		},
		children: [
			new TextRun({
				text: title.toUpperCase(),
				bold: true,
				size: s.headingSizeHp,
				font: s.font,
				color: COLOR_DARK,
			}),
		],
	});
}

function buildEntryParagraph(
	title: string,
	right: string,
	bold: boolean,
	s: DocxStyle,
): Paragraph {
	const runs: TextRun[] = [
		new TextRun({
			text: title,
			bold,
			size: s.baseSizeHp,
			font: s.font,
			color: COLOR_DARK,
		}),
	];

	if (right) {
		runs.push(
			new TextRun({
				text: "\t" + right,
				bold: false,
				size: s.baseSizeHp,
				font: s.font,
				color: COLOR_GRAY,
			}),
		);
	}

	return new Paragraph({
		spacing: {
			before: bold ? 120 : 0,
			after: bold ? 0 : 40,
			line: s.lineSpacing,
		},
		tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
		children: runs,
	});
}

function buildSubEntryParagraph(
	title: string,
	right: string,
	s: DocxStyle,
): Paragraph {
	const runs: TextRun[] = [
		new TextRun({
			text: title,
			italics: true,
			size: s.baseSizeHp,
			font: s.font,
			color: COLOR_DARK,
		}),
	];

	if (right) {
		runs.push(
			new TextRun({
				text: "\t" + right,
				italics: true,
				size: s.baseSizeHp,
				font: s.font,
				color: COLOR_GRAY,
			}),
		);
	}

	return new Paragraph({
		spacing: { after: 40, line: s.lineSpacing },
		tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
		children: runs,
	});
}

function buildBulletParagraph(text: string, s: DocxStyle): Paragraph {
	return new Paragraph({
		bullet: { level: 0 },
		spacing: { after: 20, line: s.lineSpacing },
		children: [
			new TextRun({
				text,
				size: s.baseSizeHp,
				font: s.font,
				color: COLOR_DARK,
			}),
		],
	});
}

function buildBodyParagraph(text: string, s: DocxStyle): Paragraph {
	return new Paragraph({
		spacing: { after: 80, line: s.lineSpacing },
		children: [
			new TextRun({
				text,
				size: s.baseSizeHp,
				font: s.font,
				color: COLOR_DARK,
			}),
		],
	});
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Convert a LaTeX resume string to a DOCX Blob.
 * Parses style info (margins, font, size, spacing) directly from the LaTeX.
 */
export async function generateDocxBlob(latex: string): Promise<Blob> {
	// Parse styles from the LaTeX source — this is the single source of truth
	const s = extractDocxStyle(latex);

	const children: Paragraph[] = [];

	// Header block (name + contact)
	const headerLines = extractHeaderBlock(latex);
	if (headerLines.length > 0) {
		children.push(buildNameParagraph(headerLines[0], s));
		if (headerLines.length > 1) {
			children.push(
				buildContactParagraph(headerLines.slice(1).join(" | "), s),
			);
		}
	}

	// Sections
	const sections = extractDocxSections(latex);
	for (const section of sections) {
		children.push(buildSectionHeading(section.heading, s));

		const { elements } = parseSectionBody(section.body);

		for (const el of elements) {
			switch (el.type) {
				case "entry":
					children.push(
						buildEntryParagraph(el.title, el.right, true, s),
					);
					break;
				case "subentry":
					children.push(
						buildSubEntryParagraph(el.title, el.right, s),
					);
					break;
				case "bullet":
					children.push(buildBulletParagraph(el.text, s));
					break;
				case "paragraph":
					children.push(buildBodyParagraph(el.text, s));
					break;
			}
		}
	}

	// Fallback: if nothing extracted, put raw text
	if (sections.length === 0 && headerLines.length === 0) {
		const rawText = stripLatexCommands(latex).trim();
		rawText.split(/\n{2,}/).forEach((p) => {
			children.push(buildBodyParagraph(p.replace(/\n/g, " ").trim(), s));
		});
	}

	const doc = new Document({
		sections: [
			{
				properties: {
					page: {
						margin: {
							top: mmToTwip(s.marginTopMm),
							bottom: mmToTwip(s.marginBottomMm),
							left: mmToTwip(s.marginLeftMm),
							right: mmToTwip(s.marginRightMm),
						},
					},
				},
				children,
			},
		],
	});

	return await Packer.toBlob(doc);
}

/**
 * Build the standard filename for a DOCX export.
 * Pattern: ATSResumie_<label>_<YYYY-MM-DD>.docx
 */
export function buildDocxFilename(jobLabel: string): string {
	const label = sanitizeLabel(jobLabel);
	const date = new Date().toISOString().slice(0, 10);
	return `ATSResumie_${label}_${date}.docx`;
}

/**
 * Generate and download a DOCX file from LaTeX content.
 */
export async function downloadDocxFile(
	latex: string,
	jobLabel: string,
): Promise<void> {
	const blob = await generateDocxBlob(latex);
	const filename = buildDocxFilename(jobLabel);
	saveAs(blob, filename);
}
