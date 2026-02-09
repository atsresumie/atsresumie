/**
 * LaTeX Style Injection Utility
 *
 * Applies style configuration to LaTeX source by injecting
 * package imports and settings in an idempotent way.
 *
 * Uses marker blocks to enable re-application without duplicates.
 */

import type { StyleConfig } from "@/types/editor";

// Marker comments for idempotent injection
const STYLE_BLOCK_START = "% ATSRESUMIE_STYLE_BLOCK_START";
const STYLE_BLOCK_END = "% ATSRESUMIE_STYLE_BLOCK_END";
const FONT_SIZE_MARKER = "% ATSRESUMIE_FONTSIZE";

/**
 * Apply style configuration to LaTeX source.
 *
 * Strategy:
 * 1. Remove existing style block if present (idempotent)
 * 2. Detect existing packages to avoid duplicates
 * 3. Insert style block after \documentclass
 * 4. Insert \fontsize after \begin{document}
 *
 * @param latex - Original LaTeX source
 * @param style - Style configuration to apply
 * @returns Modified LaTeX source
 */
export function applyStyleToLatex(latex: string, style: StyleConfig): string {
	let result = latex;

	// 1. Remove existing style block if present
	result = removeExistingStyleBlock(result);

	// 2. Remove existing fontsize marker if present
	result = removeExistingFontSize(result);

	// 3. Build style block
	const styleBlock = buildStyleBlock(style, result);

	// 4. Insert style block after \documentclass line
	result = insertAfterDocumentclass(result, styleBlock);

	// 5. Insert fontsize after \begin{document}
	const fontSizeCommand = buildFontSizeCommand(style);
	result = insertAfterBeginDocument(result, fontSizeCommand);

	return result;
}

/**
 * Remove existing style block from LaTeX
 */
function removeExistingStyleBlock(latex: string): string {
	const startIdx = latex.indexOf(STYLE_BLOCK_START);
	const endIdx = latex.indexOf(STYLE_BLOCK_END);

	if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
		return latex;
	}

	// Remove from start marker to end marker (inclusive of end line)
	const beforeBlock = latex.slice(0, startIdx);
	const afterBlock = latex.slice(endIdx + STYLE_BLOCK_END.length);

	// Clean up any extra newlines
	return beforeBlock + afterBlock.replace(/^\n+/, "\n");
}

/**
 * Remove existing fontsize marker line
 */
function removeExistingFontSize(latex: string): string {
	// Match the fontsize line and marker
	const fontSizeRegex = new RegExp(
		`\\\\fontsize\\{[^}]+\\}\\{[^}]+\\}\\\\selectfont\\s*${FONT_SIZE_MARKER.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\n?`,
		"g",
	);
	return latex.replace(fontSizeRegex, "");
}

/**
 * Check if a package is already loaded
 */
function hasPackage(latex: string, packageName: string): boolean {
	// Match \usepackage{package} or \usepackage[options]{package}
	const regex = new RegExp(
		`\\\\usepackage(\\[[^\\]]*\\])?\\{[^}]*\\b${packageName}\\b[^}]*\\}`,
	);
	return regex.test(latex);
}

/**
 * Build the style block to inject
 */
function buildStyleBlock(style: StyleConfig, latex: string): string {
	const lines: string[] = [STYLE_BLOCK_START];

	// Geometry package for margins and page size
	if (!hasPackage(latex, "geometry")) {
		const paperName = style.pageSize === "a4" ? "a4paper" : "letterpaper";
		lines.push(
			`\\usepackage[${paperName},top=${style.marginTopMm}mm,bottom=${style.marginBottomMm}mm,left=${style.marginLeftMm}mm,right=${style.marginRightMm}mm]{geometry}`,
		);
	} else {
		// Geometry exists - use \newgeometry to override
		const paperName = style.pageSize === "a4" ? "a4paper" : "letterpaper";
		lines.push(
			`\\geometry{${paperName},top=${style.marginTopMm}mm,bottom=${style.marginBottomMm}mm,left=${style.marginLeftMm}mm,right=${style.marginRightMm}mm}`,
		);
	}

	// Setspace package for line spacing
	if (!hasPackage(latex, "setspace")) {
		lines.push("\\usepackage{setspace}");
	}
	lines.push(`\\setstretch{${style.lineHeight.toFixed(2)}}`);

	// Section spacing via titlesec if present
	if (hasPackage(latex, "titlesec")) {
		// Adjust section spacing - before and after
		const beforePt = style.sectionSpacingPt;
		const afterPt = Math.round(style.sectionSpacingPt * 0.5);
		lines.push(
			`\\titlespacing*{\\section}{0pt}{${beforePt}pt}{${afterPt}pt}`,
		);
	}

	lines.push(STYLE_BLOCK_END);

	return lines.join("\n");
}

/**
 * Build fontsize command to insert after \begin{document}
 */
function buildFontSizeCommand(style: StyleConfig): string {
	// Baseline skip is typically 1.2 * font size
	const baselineSkip = Math.round(style.baseFontSizePt * 1.2);
	return `\\fontsize{${style.baseFontSizePt}pt}{${baselineSkip}pt}\\selectfont ${FONT_SIZE_MARKER}`;
}

/**
 * Insert content after \documentclass line
 */
function insertAfterDocumentclass(latex: string, content: string): string {
	// Find the end of \documentclass line (handles options like [11pt])
	const docclassMatch = latex.match(/\\documentclass(\[[^\]]*\])?\{[^}]+\}/);

	if (!docclassMatch) {
		console.warn("[applyStyleToLatex] No \\documentclass found");
		return latex;
	}

	const insertPos = docclassMatch.index! + docclassMatch[0].length;

	// Find the end of the line
	let endOfLine = latex.indexOf("\n", insertPos);
	if (endOfLine === -1) endOfLine = insertPos;

	return latex.slice(0, endOfLine) + "\n" + content + latex.slice(endOfLine);
}

/**
 * Insert content after \begin{document}
 */
function insertAfterBeginDocument(latex: string, content: string): string {
	const beginDocMatch = latex.match(/\\begin\{document\}/);

	if (!beginDocMatch) {
		console.warn("[applyStyleToLatex] No \\begin{document} found");
		return latex;
	}

	const insertPos = beginDocMatch.index! + beginDocMatch[0].length;

	// Find the end of the line
	let endOfLine = latex.indexOf("\n", insertPos);
	if (endOfLine === -1) endOfLine = insertPos;

	return latex.slice(0, endOfLine) + "\n" + content + latex.slice(endOfLine);
}

/**
 * Validate that styled LaTeX is still compilable
 * (basic checks only - real validation happens at compile time)
 */
export function validateStyledLatex(latex: string): {
	valid: boolean;
	error?: string;
} {
	if (!latex.includes("\\documentclass")) {
		return { valid: false, error: "Missing \\documentclass" };
	}

	if (!latex.includes("\\begin{document}")) {
		return { valid: false, error: "Missing \\begin{document}" };
	}

	if (!latex.includes("\\end{document}")) {
		return { valid: false, error: "Missing \\end{document}" };
	}

	// Check that our markers are properly paired
	const hasStartMarker = latex.includes(STYLE_BLOCK_START);
	const hasEndMarker = latex.includes(STYLE_BLOCK_END);

	if (hasStartMarker !== hasEndMarker) {
		return { valid: false, error: "Style block markers are unbalanced" };
	}

	return { valid: true };
}
