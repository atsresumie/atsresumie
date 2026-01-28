const KEY = "atsresumie:getStartedDraft:v1";

type Draft = {
	step?: 0 | 1 | 2;
	mode?: "QUICK" | "DEEP" | "FROM_SCRATCH";
	jobDescription?: string;
	resumeText?: string;
	resumeFileName?: string | null;
	focusPrompt?: string;
	analysis?: {
		versionId: string;
		atsScore: number;
		breakdown: { label: string; value: number }[];
		changes: string[];
		missing: string[];
		latexPreview: string;
	} | null;
};

export function saveDraft(d: Draft) {
	try {
		if (typeof window === "undefined") return;
		localStorage.setItem(KEY, JSON.stringify(d));
	} catch {}
}

export function loadDraft(): Draft | null {
	try {
		if (typeof window === "undefined") return null;
		const raw = localStorage.getItem(KEY);
		if (!raw) return null;
		return JSON.parse(raw) as Draft;
	} catch {
		return null;
	}
}

export function clearDraft() {
	try {
		if (typeof window === "undefined") return;
		localStorage.removeItem(KEY);
	} catch {}
}
