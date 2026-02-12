/**
 * LaTeX Style Injection Utility
 *
 * Applies style configuration to LaTeX source by injecting
 * package imports and settings in an idempotent way.
 *
 * Uses marker blocks to enable re-application without duplicates.
 */

import {
	type StyleConfig,
	type LaTeXFontFamily,
	DEFAULT_STYLE_CONFIG,
} from "@/types/editor";

// Marker comments for idempotent injection
const STYLE_BLOCK_START = "% ATSRESUMIE_STYLE_BLOCK_START";
const STYLE_BLOCK_END = "% ATSRESUMIE_STYLE_BLOCK_END";
const FONT_SIZE_MARKER = "% ATSRESUMIE_FONTSIZE";

/** LaTeX font package mappings */
const FONT_PACKAGES: Record<LaTeXFontFamily, string[]> = {
	default: [], // Computer Modern — no package needed
	lmodern: ["\\usepackage{lmodern}"],
	times: ["\\usepackage{mathptmx}"],
	helvetica: [
		"\\usepackage{helvet}",
		"\\renewcommand{\\familydefault}{\\sfdefault}",
	],
	palatino: ["\\usepackage{palatino}"],
	charter: ["\\usepackage{charter}"],
	bookman: ["\\usepackage{bookman}"],
};

/** Packages that are font-related and should be stripped  */
const FONT_PACKAGE_NAMES = [
	"mathptmx",
	"helvet",
	"palatino",
	"charter",
	"bookman",
	"lmodern",
	"times",
	"newcent",
];

/**
 * Apply style configuration to LaTeX source.
 */
export function applyStyleToLatex(latex: string, style: StyleConfig): string {
	let result = latex;

	// 1. Remove existing style block if present
	result = removeExistingStyleBlock(result);

	// 2. Remove existing fontsize marker if present
	result = removeExistingFontSize(result);

	// 3. Strip existing packages so we inject our own
	result = stripPackage(result, "geometry");
	result = stripPackage(result, "setspace");
	for (const pkg of FONT_PACKAGE_NAMES) {
		result = stripPackage(result, pkg);
	}

	// 3a. Strip XeLaTeX-only packages that break pdflatex
	for (const pkg of ["fontspec", "unicode-math", "polyglossia"]) {
		result = stripPackage(result, pkg);
	}
	result = result.replace(
		/^[ \t]*\\(?:setmainfont|setsansfont|setmonofont)\{[^}]*\}[ \t]*$\n?/gm,
		"",
	);

	// 4. Remove any existing \renewcommand{\familydefault} lines
	result = result.replace(
		/^[ \t]*\\renewcommand\{\\familydefault\}\{[^}]*\}[ \t]*$\n?/gm,
		"",
	);

	// 5. Build style block
	const styleBlock = buildStyleBlock(style, result);

	// 6. Insert style block after \documentclass line
	result = insertAfterDocumentclass(result, styleBlock);

	// 7. Insert fontsize after \begin{document}
	const fontSizeCommand = buildFontSizeCommand(style);
	result = insertAfterBeginDocument(result, fontSizeCommand);

	return result;
}

/**
 * Parse style settings from existing LaTeX source.
 * Returns a StyleConfig with values extracted from the LaTeX.
 * Falls back to defaults for anything not found.
 */
export function parseStyleFromLatex(latex: string): StyleConfig {
	const config = { ...DEFAULT_STYLE_CONFIG };

	// Parse page size from \documentclass or geometry
	if (/a4paper/i.test(latex)) {
		config.pageSize = "a4";
	} else {
		config.pageSize = "letter";
	}

	// Parse font size from \documentclass[Xpt]
	const docclassMatch = latex.match(/\\documentclass\[([^\]]*)\]/);
	if (docclassMatch) {
		const opts = docclassMatch[1];
		const ptMatch = opts.match(/(\d+)pt/);
		if (ptMatch) {
			const pt = parseInt(ptMatch[1], 10);
			if (pt >= 8 && pt <= 14) config.baseFontSizePt = pt;
		}
	}

	// Parse margins from geometry package
	const geometryMatch = latex.match(/\\usepackage\[([^\]]*)\]\{geometry\}/);
	if (geometryMatch) {
		const opts = geometryMatch[1];

		// Helper to parse a margin value with unit and convert to mm
		const parseMm = (match: RegExpMatchArray | null): number | null => {
			if (!match) return null;
			const val = parseFloat(match[1]);
			const unit = match[2] || "mm";
			const mm =
				unit === "cm" ? val * 10 : unit === "in" ? val * 25.4 : val;
			return Math.round(mm);
		};

		const topMatch = opts.match(/top=(\d+(?:\.\d+)?)(mm|cm|in)/);
		const bottomMatch = opts.match(/bottom=(\d+(?:\.\d+)?)(mm|cm|in)/);
		const leftMatch = opts.match(/left=(\d+(?:\.\d+)?)(mm|cm|in)/);
		const rightMatch = opts.match(/right=(\d+(?:\.\d+)?)(mm|cm|in)/);
		const marginMatch = opts.match(/margin=(\d+(?:\.\d+)?)(mm|cm|in)/);

		const top = parseMm(topMatch);
		const bottom = parseMm(bottomMatch);
		const left = parseMm(leftMatch);
		const right = parseMm(rightMatch);

		if (top !== null) config.marginTopMm = top;
		if (bottom !== null) config.marginBottomMm = bottom;
		if (left !== null) config.marginLeftMm = left;
		if (right !== null) config.marginRightMm = right;

		// Handle uniform margin= option
		if (marginMatch && !topMatch && !leftMatch) {
			const mm = parseMm(marginMatch)!;
			config.marginTopMm = mm;
			config.marginBottomMm = mm;
			config.marginLeftMm = mm;
			config.marginRightMm = mm;
		}
	}

	// Parse line height from setstretch
	const setstretchMatch = latex.match(/\\setstretch\{(\d+(?:\.\d+)?)\}/);
	if (setstretchMatch) {
		config.lineHeight = parseFloat(setstretchMatch[1]);
	}

	// Parse font family from known packages
	if (
		/\\usepackage\{mathptmx\}/.test(latex) ||
		/\\usepackage\{times\}/.test(latex)
	) {
		config.fontFamily = "times";
	} else if (/\\usepackage\{helvet\}/.test(latex)) {
		config.fontFamily = "helvetica";
	} else if (/\\usepackage\{palatino\}/.test(latex)) {
		config.fontFamily = "palatino";
	} else if (/\\usepackage\{charter\}/.test(latex)) {
		config.fontFamily = "charter";
	} else if (/\\usepackage\{bookman\}/.test(latex)) {
		config.fontFamily = "bookman";
	} else if (/\\usepackage\{lmodern\}/.test(latex)) {
		config.fontFamily = "lmodern";
	} else {
		config.fontFamily = "default";
	}

	// Clamp values to valid ranges
	config.marginTopMm = clamp(config.marginTopMm, 5, 40);
	config.marginBottomMm = clamp(config.marginBottomMm, 5, 40);
	config.marginLeftMm = clamp(config.marginLeftMm, 5, 40);
	config.marginRightMm = clamp(config.marginRightMm, 5, 40);
	config.baseFontSizePt = clamp(config.baseFontSizePt, 8, 12);
	config.lineHeight = clamp(config.lineHeight, 0.8, 1.5);

	return config;
}

function clamp(val: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, val));
}

// ---- Internal helpers ----

function removeExistingStyleBlock(latex: string): string {
	const startIdx = latex.indexOf(STYLE_BLOCK_START);
	const endIdx = latex.indexOf(STYLE_BLOCK_END);

	if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
		return latex;
	}

	const beforeBlock = latex.slice(0, startIdx);
	const afterBlock = latex.slice(endIdx + STYLE_BLOCK_END.length);

	return beforeBlock + afterBlock.replace(/^\n+/, "\n");
}

function removeExistingFontSize(latex: string): string {
	const fontSizeRegex = new RegExp(
		`\\\\fontsize\\{[^}]+\\}\\{[^}]+\\}\\\\selectfont\\s*${FONT_SIZE_MARKER.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\n?`,
		"g",
	);
	return latex.replace(fontSizeRegex, "");
}

function stripPackage(latex: string, packageName: string): string {
	const regex = new RegExp(
		`^[ \\t]*\\\\usepackage(\\[[^\\]]*\\])?\\{${packageName}\\}[ \\t]*$\\n?`,
		"gm",
	);
	return latex.replace(regex, "");
}

function buildStyleBlock(style: StyleConfig, latex: string): string {
	const lines: string[] = [STYLE_BLOCK_START];

	// Font family packages
	const fontLines = FONT_PACKAGES[style.fontFamily] || [];
	for (const line of fontLines) {
		lines.push(line);
	}

	// Geometry package for margins and page size
	const paperName = style.pageSize === "a4" ? "a4paper" : "letterpaper";
	lines.push(
		`\\usepackage[${paperName},top=${style.marginTopMm}mm,bottom=${style.marginBottomMm}mm,left=${style.marginLeftMm}mm,right=${style.marginRightMm}mm]{geometry}`,
	);

	// Setspace package for line spacing
	lines.push("\\usepackage{setspace}");
	lines.push(`\\setstretch{${style.lineHeight.toFixed(2)}}`);

	// Section spacing via titlesec if present in template
	const hasTitlesec =
		/\\usepackage(\[[^\]]*\])?\{[^}]*\btitlesec\b[^}]*\}/.test(latex);
	if (hasTitlesec) {
		const beforePt = style.sectionSpacingPt;
		const afterPt = Math.round(style.sectionSpacingPt * 0.5);
		lines.push(
			`\\titlespacing*{\\section}{0pt}{${beforePt}pt}{${afterPt}pt}`,
		);
	}

	lines.push(STYLE_BLOCK_END);

	return lines.join("\n");
}

function buildFontSizeCommand(style: StyleConfig): string {
	const baselineSkip = Math.round(style.baseFontSizePt * 1.2);
	return `\\fontsize{${style.baseFontSizePt}pt}{${baselineSkip}pt}\\selectfont ${FONT_SIZE_MARKER}`;
}

function insertAfterDocumentclass(latex: string, content: string): string {
	const docclassMatch = latex.match(/\\documentclass(\[[^\]]*\])?\{[^}]+\}/);

	if (!docclassMatch) {
		console.warn("[applyStyleToLatex] No \\documentclass found");
		return latex;
	}

	const insertPos = docclassMatch.index! + docclassMatch[0].length;

	let endOfLine = latex.indexOf("\n", insertPos);
	if (endOfLine === -1) endOfLine = insertPos;

	return latex.slice(0, endOfLine) + "\n" + content + latex.slice(endOfLine);
}

function insertAfterBeginDocument(latex: string, content: string): string {
	const beginDocMatch = latex.match(/\\begin\{document\}/);

	if (!beginDocMatch) {
		console.warn("[applyStyleToLatex] No \\begin{document} found");
		return latex;
	}

	const insertPos = beginDocMatch.index! + beginDocMatch[0].length;

	let endOfLine = latex.indexOf("\n", insertPos);
	if (endOfLine === -1) endOfLine = insertPos;

	return latex.slice(0, endOfLine) + "\n" + content + latex.slice(endOfLine);
}

/**
 * Validate that styled LaTeX is still compilable
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

	const hasStartMarker = latex.includes(STYLE_BLOCK_START);
	const hasEndMarker = latex.includes(STYLE_BLOCK_END);

	if (hasStartMarker !== hasEndMarker) {
		return { valid: false, error: "Style block markers are unbalanced" };
	}

	return { valid: true };
}
