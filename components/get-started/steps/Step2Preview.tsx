"use client";

import { Download, RotateCcw } from "lucide-react";
import AtsRing from "@/components/ats/AtsRing";
import KeywordBars from "@/components/ats/KeywordBars";
import { AnalyzeResult, ExportResult } from "../types";

interface Step2PreviewProps {
	analysis: AnalyzeResult;
	exportResult: ExportResult | null;
	isAnalyzing: boolean;
	isExporting: boolean;
	onEditInputs: () => void;
	onRegenerate: () => void;
	onExport: () => void;
}

export default function Step2Preview({
	analysis,
	exportResult,
	isAnalyzing,
	isExporting,
	onEditInputs,
	onRegenerate,
	onExport,
}: Step2PreviewProps) {
	return (
		<section className="space-y-5">
			{/* Score header */}
			<div className="flex items-center justify-between gap-3">
				<div>
					<div className="text-sm text-[rgba(233,221,199,0.75)]">
						Estimated ATS Match
					</div>
					<div className="mt-1 text-2xl font-semibold tracking-tight">
						{analysis.atsScore} / 100
					</div>
				</div>

				<div className="w-23">
					<AtsRing value={analysis.atsScore} />
				</div>
			</div>

			{/* Keyword breakdown */}
			<KeywordBars items={analysis.breakdown} />

			{/* Changes and missing context */}
			<div className="grid gap-4 md:grid-cols-2">
				<div className="rounded-xl border border-[rgba(233,221,199,0.12)] bg-[rgba(233,221,199,0.04)] p-4">
					<div className="text-sm font-medium">What we improved</div>
					<ul className="mt-2 space-y-2 text-sm text-[rgba(233,221,199,0.75)]">
						{analysis.changes.map((c, i) => (
							<li key={i} className="leading-relaxed">
								• {c}
							</li>
						))}
					</ul>
				</div>

				<div className="rounded-xl border border-[rgba(233,221,199,0.12)] bg-[rgba(233,221,199,0.04)] p-4">
					<div className="text-sm font-medium">
						Suggested missing context
					</div>
					<ul className="mt-2 space-y-2 text-sm text-[rgba(233,221,199,0.75)]">
						{analysis.missing.map((m, i) => (
							<li key={i} className="leading-relaxed">
								• {m}
							</li>
						))}
					</ul>
					<button
						onClick={onEditInputs}
						className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-[rgba(233,221,199,0.15)] bg-[rgba(233,221,199,0.06)] px-3 py-2 text-sm hover:bg-[rgba(233,221,199,0.10)]"
					>
						Edit inputs
					</button>
				</div>
			</div>

			{/* LaTeX preview */}
			<div className="rounded-xl border border-[rgba(233,221,199,0.12)] bg-[rgba(233,221,199,0.03)] p-4">
				<div className="flex items-center justify-between">
					<div className="text-sm font-medium">LaTeX preview</div>
					<button
						onClick={() =>
							navigator.clipboard.writeText(analysis.latexPreview)
						}
						className="rounded-lg border border-[rgba(233,221,199,0.15)] bg-[rgba(233,221,199,0.06)] px-2 py-1 text-xs hover:bg-[rgba(233,221,199,0.10)]"
					>
						Copy
					</button>
				</div>
				<pre className="mt-3 max-h-56 overflow-auto rounded-lg bg-[rgba(0,0,0,0.35)] p-3 text-xs text-[rgba(233,221,199,0.75)]">
					{analysis.latexPreview}
				</pre>
			</div>

			{/* Action buttons */}
			<div className="flex flex-col gap-3 sm:flex-row">
				<button
					onClick={onRegenerate}
					className="inline-flex w-full items-center justify-center rounded-xl border border-[rgba(233,221,199,0.15)] bg-[rgba(233,221,199,0.06)] px-4 py-3 text-sm hover:bg-[rgba(233,221,199,0.10)] sm:w-1/2"
					disabled={isAnalyzing}
				>
					<RotateCcw className="mr-2 h-4 w-4" />
					{isAnalyzing ? "Re-running…" : "Regenerate"}
				</button>

				<button
					onClick={onExport}
					disabled={isExporting}
					className="inline-flex w-full items-center justify-center rounded-xl bg-[#E9DDC7] px-4 py-3 text-sm font-medium text-[#2a1e18] shadow-[0_10px_30px_rgba(233,221,199,0.12)] hover:-translate-y-px hover:shadow-[0_16px_40px_rgba(233,221,199,0.16)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 sm:w-1/2"
				>
					<Download className="mr-2 h-4 w-4" />
					{isExporting ? "Exporting…" : "Download PDF (1 credit)"}
				</button>
			</div>

			{/* Export result */}
			{exportResult && (
				<div className="rounded-xl border border-[rgba(233,221,199,0.12)] bg-[rgba(233,221,199,0.04)] p-4">
					<div className="text-sm font-medium">Export ready</div>
					<div className="mt-2 flex flex-col gap-2 text-sm text-[rgba(233,221,199,0.75)]">
						<a
							className="underline underline-offset-4 hover:opacity-90"
							href={exportResult.pdfUrl}
							target="_blank"
							rel="noreferrer"
						>
							Open PDF
						</a>
						<button
							className="w-fit rounded-lg border border-[rgba(233,221,199,0.15)] bg-[rgba(233,221,199,0.06)] px-3 py-2 text-xs hover:bg-[rgba(233,221,199,0.10)]"
							onClick={() =>
								navigator.clipboard.writeText(exportResult.latex)
							}
						>
							Copy full LaTeX
						</button>
					</div>
				</div>
			)}
		</section>
	);
}
