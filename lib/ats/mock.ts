function hashToRange(s: string, min: number, max: number) {
	let h = 0;
	for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
	const t = h / 4294967295;
	return Math.round(min + t * (max - min));
}

export function mockAnalyze({
	mode,
	jobDescription,
	resumeText,
	focusPrompt,
}: {
	mode: "QUICK" | "DEEP" | "FROM_SCRATCH";
	jobDescription: string;
	resumeText: string;
	focusPrompt?: string;
}) {
	const seed = `${mode}::${jobDescription.slice(0, 500)}::${resumeText.slice(
		0,
		500
	)}::${focusPrompt ?? ""}`;
	const base = hashToRange(seed, 62, 86);
	const bump = mode === "DEEP" ? 5 : mode === "FROM_SCRATCH" ? 2 : 0;

	const atsScore = Math.min(100, base + bump);

	const breakdown = [
		{ label: "Keyword match", value: Math.min(100, atsScore - 5) },
		{ label: "ATS formatting safety", value: Math.min(100, atsScore + 4) },
		{ label: "Role alignment", value: Math.min(100, atsScore - 2) },
		{ label: "Impact strength", value: Math.min(100, atsScore - 10) },
	];

	const changes = [
		"Rewrote 6 bullets using action + impact structure.",
		"Aligned skills section with job keywords (no skill hallucinations).",
		"Improved section ordering to be ATS-parser friendly.",
		"Normalized dates and titles for consistent parsing.",
	];

	const missing = [
		"Add 2–3 measurable metrics (%, $, time saved).",
		"Confirm location + work authorization line.",
		"Choose preferred length (1 page vs 2 pages).",
		"Verify top skills you actually have.",
	];

	const latexPreview = `\\documentclass[11pt]{article}
\\begin{document}
\\section*{Your Name} 
\\textit{ATS-optimized LaTeX resume (preview)}\\\\
\\vspace{6pt}
\\textbf{Tailoring Mode:} ${mode}\\\\
\\textbf{ATS Score (est.):} ${atsScore}/100\\\\
\\vspace{8pt}
\\section*{Summary}
Results-driven candidate aligned to the target role. Focus: ${
		focusPrompt ? focusPrompt.replace(/\n/g, " ") : "—"
	}
\\end{document}`;

	return {
		versionId: `v_${Date.now()}`,
		atsScore,
		breakdown,
		changes,
		missing,
		latexPreview,
	};
}
