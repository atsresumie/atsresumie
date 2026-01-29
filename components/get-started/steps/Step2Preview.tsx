"use client";

import { Download, Lock } from "lucide-react";
import AtsRing from "@/components/ats/AtsRing";
import KeywordBars from "@/components/ats/KeywordBars";
import { AnalyzeResult, ExportResult } from "../types";
import { useAuth } from "@/hooks/useAuth";

interface Step2PreviewProps {
	analysis: AnalyzeResult | null;
	latexText: string | null; // Claude-generated LaTeX from generation job
	exportResult: ExportResult | null;
	isExporting: boolean;
	onEditInputs: () => void;
	onExport: () => void;
}

export default function Step2Preview({
	analysis,
	latexText,
	exportResult,
	isExporting,
	onEditInputs,
	onExport,
}: Step2PreviewProps) {
	const { isAuthenticated } = useAuth();

	// Use latexText from generation job, fallback to analysis.latexPreview for backward compat
	const displayLatex = latexText || analysis?.latexPreview || "";

	return (
		<section className="space-y-5">
			{/* ATS analysis sections - only shown when analysis is available */}
			{analysis && (
				<>
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
							<div className="text-sm font-medium">
								What we improved
							</div>
							<ul className="mt-2 space-y-2 text-sm text-[rgba(233,221,199,0.75)]">
								{(analysis.changes || []).map((c, i) => (
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
								{(analysis.missing || []).map((m, i) => (
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
				</>
			)}

			{/* LaTeX preview - gated behind authentication */}
			<div className="rounded-xl border border-[rgba(233,221,199,0.12)] bg-[rgba(233,221,199,0.03)] p-4">
				<div className="flex items-center justify-between">
					<div className="text-sm font-medium">Generated LaTeX</div>
					<button
						onClick={() =>
							isAuthenticated &&
							navigator.clipboard.writeText(displayLatex)
						}
						disabled={!isAuthenticated}
						className={`rounded-lg border px-2 py-1 text-xs ${
							isAuthenticated
								? "border-[rgba(233,221,199,0.15)] bg-[rgba(233,221,199,0.06)] hover:bg-[rgba(233,221,199,0.10)]"
								: "border-[rgba(233,221,199,0.08)] bg-[rgba(233,221,199,0.03)] text-[rgba(233,221,199,0.4)] cursor-not-allowed"
						}`}
					>
						{isAuthenticated ? "Copy" : "Copy (Sign in required)"}
					</button>
				</div>
				<div className="relative mt-3">
					<pre
						className={`max-h-80 overflow-auto rounded-lg bg-[rgba(0,0,0,0.35)] p-3 text-xs text-[rgba(233,221,199,0.75)] font-mono ${
							!isAuthenticated
								? "blur-sm select-none pointer-events-none"
								: ""
						}`}
					>
						{displayLatex || "Generating LaTeX..."}
					</pre>

					{/* Overlay for non-authenticated users */}
					{!isAuthenticated && displayLatex && (
						<div className="absolute inset-0 flex items-center justify-center bg-[rgba(26,18,14,0.7)] rounded-lg backdrop-blur-sm">
							<div className="text-center px-4">
								<Lock className="h-8 w-8 mx-auto mb-2 text-[rgba(233,221,199,0.6)]" />
								<p className="text-sm font-medium text-[rgba(233,221,199,0.9)]">
									Sign in to view and copy LaTeX code
								</p>
								<p className="text-xs text-[rgba(233,221,199,0.6)] mt-1">
									Click &quot;Download PDF&quot; below to
									authenticate
								</p>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Action buttons */}
			<div className="flex flex-col gap-3 sm:flex-row">
				<button
					onClick={onEditInputs}
					className="inline-flex w-full items-center justify-center rounded-xl border border-[rgba(233,221,199,0.15)] bg-[rgba(233,221,199,0.06)] px-4 py-3 text-sm hover:bg-[rgba(233,221,199,0.10)] sm:w-1/2"
				>
					← Go Back
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
								navigator.clipboard.writeText(
									exportResult.latex,
								)
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
