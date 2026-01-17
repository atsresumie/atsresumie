"use client";

import { FileText } from "lucide-react";

interface Step1InputFormProps {
	jobDescription: string;
	onJobDescriptionChange: (value: string) => void;
	resumeText: string;
	onResumeTextChange: (value: string) => void;
	focusPrompt: string;
	onFocusPromptChange: (value: string) => void;
	canAnalyze: boolean;
	isAnalyzing: boolean;
	onBack: () => void;
	onAnalyze: () => void;
}

export default function Step1InputForm({
	jobDescription,
	onJobDescriptionChange,
	resumeText,
	onResumeTextChange,
	focusPrompt,
	onFocusPromptChange,
	canAnalyze,
	isAnalyzing,
	onBack,
	onAnalyze,
}: Step1InputFormProps) {
	return (
		<section className="space-y-4">
			<div className="flex items-center gap-2 text-sm text-[rgba(233,221,199,0.75)]">
				<FileText className="h-4 w-4" />
				Paste the essentials
			</div>

			<div className="space-y-3">
				<label className="block">
					<div className="mb-1 text-sm">Job Description</div>
					<textarea
						value={jobDescription}
						onChange={(e) => onJobDescriptionChange(e.target.value)}
						placeholder="Paste the full job posting…"
						className="h-44 w-full resize-none rounded-xl border border-[rgba(233,221,199,0.12)] bg-[rgba(233,221,199,0.05)] p-3 text-sm outline-none placeholder:text-[rgba(233,221,199,0.35)] focus:border-[rgba(233,221,199,0.22)]"
					/>
					<div className="mt-1 text-xs text-[rgba(233,221,199,0.55)]">
						Tip: include responsibilities + requirements +
						nice-to-have keywords.
					</div>
				</label>

				<label className="block">
					<div className="mb-1 text-sm">Current Resume (text)</div>
					<textarea
						value={resumeText}
						onChange={(e) => onResumeTextChange(e.target.value)}
						placeholder="Paste your resume text (or convert from PDF/DOCX)…"
						className="h-44 w-full resize-none rounded-xl border border-[rgba(233,221,199,0.12)] bg-[rgba(233,221,199,0.05)] p-3 text-sm outline-none placeholder:text-[rgba(233,221,199,0.35)] focus:border-[rgba(233,221,199,0.22)]"
					/>
					<div className="mt-1 text-xs text-[rgba(233,221,199,0.55)]">
						Keep personal info minimal; you can edit later.
					</div>
				</label>

				<label className="block">
					<div className="mb-1 text-sm">Focus (optional)</div>
					<input
						value={focusPrompt}
						onChange={(e) => onFocusPromptChange(e.target.value)}
						placeholder="e.g., Emphasize Node.js, scalability, and impact metrics. Keep 1 page."
						className="w-full rounded-xl border border-[rgba(233,221,199,0.12)] bg-[rgba(233,221,199,0.05)] p-3 text-sm outline-none placeholder:text-[rgba(233,221,199,0.35)] focus:border-[rgba(233,221,199,0.22)]"
					/>
				</label>
			</div>

			<div className="flex flex-col gap-3 pt-2 sm:flex-row">
				<button
					onClick={onBack}
					className="inline-flex w-full items-center justify-center rounded-xl border border-[rgba(233,221,199,0.15)] bg-[rgba(233,221,199,0.06)] px-4 py-3 text-sm hover:bg-[rgba(233,221,199,0.10)] sm:w-1/2"
				>
					Back
				</button>
				<button
					disabled={!canAnalyze}
					onClick={onAnalyze}
					className="inline-flex w-full items-center justify-center rounded-xl bg-[#E9DDC7] px-4 py-3 text-sm font-medium text-[#2a1e18] shadow-[0_10px_30px_rgba(233,221,199,0.12)] hover:-translate-y-px hover:shadow-[0_16px_40px_rgba(233,221,199,0.16)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 sm:w-1/2"
				>
					{isAnalyzing ? "Analyzing…" : "Analyze & Preview"}
				</button>
			</div>

			<p className="text-xs text-[rgba(233,221,199,0.55)]">
				Preview is free. Export to PDF uses credits after signup.
			</p>
		</section>
	);
}
