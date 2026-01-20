export type AnalyzeResult = {
	versionId: string;
	atsScore: number;
	breakdown: { label: string; value: number }[];
	changes: string[];
	missing: string[];
	latexPreview: string;
};

export type ExportResult = {
	pdfUrl: string;
	latex: string;
};

export type Step = 0 | 1 | 2;

export const STEPS = ["Choose mode", "Add inputs", "Preview"] as const;
