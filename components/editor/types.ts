export type RenderPayload = {
	title: {
		name: string;
		subtitle?: string;
		contacts: string[];
	};
	sections: Array<{
		id: string;
		heading: string;
		items: Array<
			| {
					type: "bullets";
					title?: string;
					subtitle?: string;
					meta?: string;
					bullets: string[];
			  }
			| {
					type: "paragraph";
					text: string;
			  }
		>;
	}>;
};

export type EditorPageSize = "letter" | "a4";
export type EditorLayout = "compact" | "balanced" | "airy";
export type EditorFontFamily = "atelier-sans" | "atelier-serif" | "classic-serif" | "clean-sans" | "mono";

export interface EditorSettings {
	fontFamily: EditorFontFamily;
	baseFontSize: number;
	headingScale: number;
	lineHeight: number;
	marginInches: number;
	pageSize: EditorPageSize;
	sectionSpacing: number;
	layout: EditorLayout;
}

export const DEFAULT_EDITOR_FILENAME = "ATSResumie_Resume.pdf";

export const DEFAULT_EDITOR_SETTINGS: EditorSettings = {
	fontFamily: "atelier-sans",
	baseFontSize: 11,
	headingScale: 1.35,
	lineHeight: 1.45,
	marginInches: 0.65,
	pageSize: "letter",
	sectionSpacing: 14,
	layout: "balanced",
};

export const FONT_FAMILY_OPTIONS: Array<{
	value: EditorFontFamily;
	label: string;
	fontFamily: string;
}> = [
	{
		value: "atelier-sans",
		label: "Atelier Sans",
		fontFamily:
			'var(--font-body), "IBM Plex Sans", -apple-system, BlinkMacSystemFont, sans-serif',
	},
	{
		value: "atelier-serif",
		label: "Atelier Serif",
		fontFamily: 'var(--font-display), "Newsreader", Georgia, serif',
	},
	{
		value: "classic-serif",
		label: "Classic Serif",
		fontFamily: '"Times New Roman", Times, serif',
	},
	{
		value: "clean-sans",
		label: "Clean Sans",
		fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
	},
	{
		value: "mono",
		label: "Monospace",
		fontFamily: '"SF Mono", Menlo, Monaco, Consolas, monospace',
	},
];
