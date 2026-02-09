/**
 * Resume Canvas Editor Types
 * Defines structures for rendering resume content and editor settings.
 */

/**
 * Structured resume content for rendering
 */
export interface RenderPayload {
	title: {
		name: string;
		subtitle?: string;
		contacts: string[];
	};
	sections: ResumeSection[];
}

export interface ResumeSection {
	id: string;
	heading: string;
	items: ResumeSectionItem[];
}

export type ResumeSectionItem =
	| {
			type: "bullets";
			title?: string;
			subtitle?: string;
			meta?: string;
			bullets: string[];
	  }
	| { type: "paragraph"; text: string };

/**
 * Editor settings for formatting
 */
export interface EditorSettings {
	fontFamily: FontFamily;
	baseFontSize: number; // 10-14pt
	headingScale: number; // 1.2-2.0
	lineHeight: number; // 1.2-2.0
	marginTop: number; // mm
	marginBottom: number;
	marginLeft: number;
	marginRight: number;
	pageSize: PageSize;
	sectionSpacing: number; // px
}

export type FontFamily =
	| "Manrope, sans-serif"
	| "DM Sans, sans-serif"
	| "IBM Plex Mono, monospace";

export type PageSize = "letter" | "a4";

/**
 * Page dimensions in mm
 */
export const PAGE_DIMENSIONS: Record<
	PageSize,
	{ width: number; height: number }
> = {
	letter: { width: 215.9, height: 279.4 },
	a4: { width: 210, height: 297 },
};

/**
 * Default editor settings
 */
export const DEFAULT_EDITOR_SETTINGS: EditorSettings = {
	fontFamily: "DM Sans, sans-serif",
	baseFontSize: 11,
	headingScale: 1.4,
	lineHeight: 1.4,
	marginTop: 20,
	marginBottom: 20,
	marginLeft: 20,
	marginRight: 20,
	pageSize: "letter",
	sectionSpacing: 16,
};

/**
 * Font options for the editor
 */
export const FONT_OPTIONS: { value: FontFamily; label: string }[] = [
	{ value: "DM Sans, sans-serif", label: "DM Sans" },
	{ value: "Manrope, sans-serif", label: "Manrope" },
	{ value: "IBM Plex Mono, monospace", label: "IBM Plex Mono" },
];

/**
 * Page size options
 */
export const PAGE_SIZE_OPTIONS: { value: PageSize; label: string }[] = [
	{ value: "letter", label: "US Letter" },
	{ value: "a4", label: "A4" },
];

// ============================================
// PDF Style Config (for LaTeX compilation)
// ============================================

/**
 * Style configuration for LaTeX PDF generation.
 * These values are injected into the LaTeX preamble.
 */
export interface StyleConfig {
	pageSize: PageSize;
	marginTopMm: number; // 10-40mm
	marginBottomMm: number;
	marginLeftMm: number;
	marginRightMm: number;
	baseFontSizePt: number; // 10-12pt
	lineHeight: number; // 1.0-1.4
	sectionSpacingPt: number; // 4-12pt
}

/**
 * Default style config matching typical LaTeX resume templates
 */
export const DEFAULT_STYLE_CONFIG: StyleConfig = {
	pageSize: "letter",
	marginTopMm: 15,
	marginBottomMm: 15,
	marginLeftMm: 18,
	marginRightMm: 18,
	baseFontSizePt: 10,
	lineHeight: 1.15,
	sectionSpacingPt: 8,
};

/**
 * localStorage key prefix for style configs
 */
export const STYLE_CONFIG_STORAGE_KEY_PREFIX = "atsresumie_style_config_";
