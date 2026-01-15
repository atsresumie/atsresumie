"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { FileText, Sparkles, Download, RotateCcw } from "lucide-react";

import AnimatedBackground from "@/components/get-started/AnimatedBackground";
import Stepper from "@/components/get-started/Stepper";
import ModeCards, { ResumeMode } from "@/components/get-started/ModeCards";
import SignupGateModal from "@/components/get-started/SignupGateModal";
import AtsRing from "@/components/ats/AtsRing";
import KeywordBars from "@/components/ats/KeywordBars";
import { loadDraft, saveDraft, clearDraft } from "@/lib/storage/draft";

type AnalyzeResult = {
	versionId: string;
	atsScore: number;
	breakdown: { label: string; value: number }[];
	changes: string[];
	missing: string[];
	latexPreview: string;
};

const steps = ["Choose mode", "Add inputs", "Preview"];

export default function GetStartedPage() {
	const reduceMotion = useReducedMotion();

	const [step, setStep] = useState<0 | 1 | 2>(0);
	const [mode, setMode] = useState<ResumeMode>("QUICK");

	const [jobDescription, setJobDescription] = useState("");
	const [resumeText, setResumeText] = useState("");
	const [focusPrompt, setFocusPrompt] = useState("");

	const [isAnalyzing, setIsAnalyzing] = useState(false);
	const [analysis, setAnalysis] = useState<AnalyzeResult | null>(null);

	const [showGate, setShowGate] = useState(false);
	const [isExporting, setIsExporting] = useState(false);
	const [exportResult, setExportResult] = useState<null | {
		pdfUrl: string;
		latex: string;
	}>(null);

	// ---- Draft persistence (anonymous-friendly) ----
	useEffect(() => {
		const d = loadDraft();
		if (!d) return;
		setMode(d.mode ?? "QUICK");
		setJobDescription(d.jobDescription ?? "");
		setResumeText(d.resumeText ?? "");
		setFocusPrompt(d.focusPrompt ?? "");
		if (d.step !== undefined) setStep(d.step);
	}, []);

	useEffect(() => {
		saveDraft({
			step,
			mode,
			jobDescription,
			resumeText,
			focusPrompt,
			analysis,
		});
	}, [step, mode, jobDescription, resumeText, focusPrompt, analysis]);

	const canContinueFromStep0 = !!mode;
	const canAnalyze =
		jobDescription.trim().length > 50 &&
		resumeText.trim().length > 50 &&
		!isAnalyzing;

	const headline = useMemo(() => {
		if (step === 0) return "Choose your optimization mode";
		if (step === 1) return "Paste your job + resume";
		return "Preview your ATS-ready result";
	}, [step]);

	async function runAnalyze() {
		setIsAnalyzing(true);
		setExportResult(null);
		try {
			const res = await fetch("/api/analyze", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					mode,
					jobDescription,
					resumeText,
					focusPrompt,
				}),
			});
			if (!res.ok) throw new Error("Analyze failed");
			const data = (await res.json()) as AnalyzeResult;
			setAnalysis(data);
			setStep(2);
		} catch (e) {
			console.error(e);
			alert("Analysis failed. Please try again.");
		} finally {
			setIsAnalyzing(false);
		}
	}

	// Stub: replace with your auth state (NextAuth session)
	const isLoggedIn = false;

	async function exportPdf() {
		if (!analysis) return;

		// Gate download behind login (Option C)
		if (!isLoggedIn) {
			setShowGate(true);
			return;
		}

		setIsExporting(true);
		try {
			const res = await fetch("/api/export", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ versionId: analysis.versionId }),
			});
			if (!res.ok) throw new Error("Export failed");
			const data = (await res.json()) as {
				pdfUrl: string;
				latex: string;
			};
			setExportResult(data);
		} catch (e) {
			console.error(e);
			alert("Export failed. Please try again.");
		} finally {
			setIsExporting(false);
		}
	}

	function resetAll() {
		setStep(0);
		setMode("QUICK");
		setJobDescription("");
		setResumeText("");
		setFocusPrompt("");
		setAnalysis(null);
		setExportResult(null);
		clearDraft();
	}

	return (
		<div className="min-h-screen bg-[#1a120e] text-[#E9DDC7]">
			<AnimatedBackground />

			{/* Top nav (minimal) */}
			<div className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5">
				<div className="flex items-center gap-2">
					<div className="h-8 w-8 rounded-xl bg-linear-to-br from-[#3B2A21] to-[#C8B08A] shadow-[0_0_0_1px_rgba(233,221,199,0.15)]" />
					<span className="font-semibold tracking-tight">
						atsresumie
					</span>
				</div>

				<div className="flex items-center gap-3">
					<button
						onClick={resetAll}
						className="hidden rounded-xl border border-[rgba(233,221,199,0.15)] bg-[rgba(233,221,199,0.06)] px-3 py-2 text-sm hover:bg-[rgba(233,221,199,0.10)] md:inline-flex"
					>
						<RotateCcw className="mr-2 h-4 w-4" />
						Reset
					</button>

					<div className="rounded-full border border-[rgba(233,221,199,0.15)] bg-[rgba(233,221,199,0.06)] px-3 py-1 text-xs">
						Preview free • Export uses credits
					</div>
				</div>
			</div>

			<main className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-20">
				{/* Header */}
				<div className="flex flex-col gap-4 pt-6 md:flex-row md:items-end md:justify-between">
					<div className="max-w-2xl">
						<motion.h1
							initial={
								reduceMotion ? false : { opacity: 0, y: 10 }
							}
							animate={
								reduceMotion ? undefined : { opacity: 1, y: 0 }
							}
							transition={{
								type: "spring",
								stiffness: 120,
								damping: 18,
							}}
							className="text-balance text-3xl font-semibold tracking-tight md:text-4xl"
						>
							{headline}
						</motion.h1>
						<p className="mt-2 text-sm text-[rgba(233,221,199,0.75)] md:text-base">
							Start without an account. Get a preview score and
							suggested improvements. Downloading the PDF is gated
							behind signup (3 free credits).
						</p>
					</div>

					<div className="w-full md:w-90">
						<Stepper steps={steps} current={step} />
					</div>
				</div>

				{/* Content */}
				<div className="mt-8 grid gap-6 md:grid-cols-12">
					{/* Left panel */}
					<div className="md:col-span-7">
						<div className="rounded-2xl border border-[rgba(233,221,199,0.12)] bg-[rgba(20,14,11,0.55)] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur">
							{step === 0 && (
								<section className="space-y-4">
									<div className="flex items-center gap-2 text-sm text-[rgba(233,221,199,0.75)]">
										<Sparkles className="h-4 w-4" />
										Pick the level of tailoring
									</div>

									<ModeCards
										value={mode}
										onChange={setMode}
									/>

									<div className="pt-2">
										<button
											disabled={!canContinueFromStep0}
											onClick={() => setStep(1)}
											className="inline-flex w-full items-center justify-center rounded-xl bg-[#E9DDC7] px-4 py-3 text-sm font-medium text-[#2a1e18] shadow-[0_10px_30px_rgba(233,221,199,0.12)] hover:-translate-y-px hover:shadow-[0_16px_40px_rgba(233,221,199,0.16)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
										>
											Continue
										</button>
									</div>
								</section>
							)}

							{step === 1 && (
								<section className="space-y-4">
									<div className="flex items-center gap-2 text-sm text-[rgba(233,221,199,0.75)]">
										<FileText className="h-4 w-4" />
										Paste the essentials
									</div>

									<div className="space-y-3">
										<label className="block">
											<div className="mb-1 text-sm">
												Job Description
											</div>
											<textarea
												value={jobDescription}
												onChange={(e) =>
													setJobDescription(
														e.target.value
													)
												}
												placeholder="Paste the full job posting…"
												className="h-44 w-full resize-none rounded-xl border border-[rgba(233,221,199,0.12)] bg-[rgba(233,221,199,0.05)] p-3 text-sm outline-none placeholder:text-[rgba(233,221,199,0.35)] focus:border-[rgba(233,221,199,0.22)]"
											/>
											<div className="mt-1 text-xs text-[rgba(233,221,199,0.55)]">
												Tip: include responsibilities +
												requirements + nice-to-have
												keywords.
											</div>
										</label>

										<label className="block">
											<div className="mb-1 text-sm">
												Current Resume (text)
											</div>
											<textarea
												value={resumeText}
												onChange={(e) =>
													setResumeText(
														e.target.value
													)
												}
												placeholder="Paste your resume text (or convert from PDF/DOCX)…"
												className="h-44 w-full resize-none rounded-xl border border-[rgba(233,221,199,0.12)] bg-[rgba(233,221,199,0.05)] p-3 text-sm outline-none placeholder:text-[rgba(233,221,199,0.35)] focus:border-[rgba(233,221,199,0.22)]"
											/>
											<div className="mt-1 text-xs text-[rgba(233,221,199,0.55)]">
												Keep personal info minimal; you
												can edit later.
											</div>
										</label>

										<label className="block">
											<div className="mb-1 text-sm">
												Focus (optional)
											</div>
											<input
												value={focusPrompt}
												onChange={(e) =>
													setFocusPrompt(
														e.target.value
													)
												}
												placeholder="e.g., Emphasize Node.js, scalability, and impact metrics. Keep 1 page."
												className="w-full rounded-xl border border-[rgba(233,221,199,0.12)] bg-[rgba(233,221,199,0.05)] p-3 text-sm outline-none placeholder:text-[rgba(233,221,199,0.35)] focus:border-[rgba(233,221,199,0.22)]"
											/>
										</label>
									</div>

									<div className="flex flex-col gap-3 pt-2 sm:flex-row">
										<button
											onClick={() => setStep(0)}
											className="inline-flex w-full items-center justify-center rounded-xl border border-[rgba(233,221,199,0.15)] bg-[rgba(233,221,199,0.06)] px-4 py-3 text-sm hover:bg-[rgba(233,221,199,0.10)] sm:w-1/2"
										>
											Back
										</button>
										<button
											disabled={!canAnalyze}
											onClick={runAnalyze}
											className="inline-flex w-full items-center justify-center rounded-xl bg-[#E9DDC7] px-4 py-3 text-sm font-medium text-[#2a1e18] shadow-[0_10px_30px_rgba(233,221,199,0.12)] hover:-translate-y-px hover:shadow-[0_16px_40px_rgba(233,221,199,0.16)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 sm:w-1/2"
										>
											{isAnalyzing
												? "Analyzing…"
												: "Analyze & Preview"}
										</button>
									</div>

									<p className="text-xs text-[rgba(233,221,199,0.55)]">
										Preview is free. Export to PDF uses
										credits after signup.
									</p>
								</section>
							)}

							{step === 2 && analysis && (
								<section className="space-y-5">
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
											<AtsRing
												value={analysis.atsScore}
											/>
										</div>
									</div>

									<KeywordBars items={analysis.breakdown} />

									<div className="grid gap-4 md:grid-cols-2">
										<div className="rounded-xl border border-[rgba(233,221,199,0.12)] bg-[rgba(233,221,199,0.04)] p-4">
											<div className="text-sm font-medium">
												What we improved
											</div>
											<ul className="mt-2 space-y-2 text-sm text-[rgba(233,221,199,0.75)]">
												{analysis.changes.map(
													(c, i) => (
														<li
															key={i}
															className="leading-relaxed"
														>
															• {c}
														</li>
													)
												)}
											</ul>
										</div>

										<div className="rounded-xl border border-[rgba(233,221,199,0.12)] bg-[rgba(233,221,199,0.04)] p-4">
											<div className="text-sm font-medium">
												Suggested missing context
											</div>
											<ul className="mt-2 space-y-2 text-sm text-[rgba(233,221,199,0.75)]">
												{analysis.missing.map(
													(m, i) => (
														<li
															key={i}
															className="leading-relaxed"
														>
															• {m}
														</li>
													)
												)}
											</ul>
											<button
												onClick={() => setStep(1)}
												className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-[rgba(233,221,199,0.15)] bg-[rgba(233,221,199,0.06)] px-3 py-2 text-sm hover:bg-[rgba(233,221,199,0.10)]"
											>
												Edit inputs
											</button>
										</div>
									</div>

									<div className="rounded-xl border border-[rgba(233,221,199,0.12)] bg-[rgba(233,221,199,0.03)] p-4">
										<div className="flex items-center justify-between">
											<div className="text-sm font-medium">
												LaTeX preview
											</div>
											<button
												onClick={() =>
													navigator.clipboard.writeText(
														analysis.latexPreview
													)
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

									<div className="flex flex-col gap-3 sm:flex-row">
										<button
											onClick={runAnalyze}
											className="inline-flex w-full items-center justify-center rounded-xl border border-[rgba(233,221,199,0.15)] bg-[rgba(233,221,199,0.06)] px-4 py-3 text-sm hover:bg-[rgba(233,221,199,0.10)] sm:w-1/2"
											disabled={isAnalyzing}
										>
											<RotateCcw className="mr-2 h-4 w-4" />
											{isAnalyzing
												? "Re-running…"
												: "Regenerate"}
										</button>

										<button
											onClick={exportPdf}
											disabled={isExporting}
											className="inline-flex w-full items-center justify-center rounded-xl bg-[#E9DDC7] px-4 py-3 text-sm font-medium text-[#2a1e18] shadow-[0_10px_30px_rgba(233,221,199,0.12)] hover:-translate-y-px hover:shadow-[0_16px_40px_rgba(233,221,199,0.16)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 sm:w-1/2"
										>
											<Download className="mr-2 h-4 w-4" />
											{isExporting
												? "Exporting…"
												: "Download PDF (1 credit)"}
										</button>
									</div>

									{exportResult && (
										<div className="rounded-xl border border-[rgba(233,221,199,0.12)] bg-[rgba(233,221,199,0.04)] p-4">
											<div className="text-sm font-medium">
												Export ready
											</div>
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
															exportResult.latex
														)
													}
												>
													Copy full LaTeX
												</button>
											</div>
										</div>
									)}
								</section>
							)}
						</div>
					</div>

					{/* Right panel (static “mini value” area) */}
					<div className="md:col-span-5">
						<motion.div
							initial={
								reduceMotion ? false : { opacity: 0, y: 14 }
							}
							animate={
								reduceMotion ? undefined : { opacity: 1, y: 0 }
							}
							transition={{
								type: "spring",
								stiffness: 110,
								damping: 18,
								delay: 0.05,
							}}
							className="rounded-2xl border border-[rgba(233,221,199,0.12)] bg-[rgba(20,14,11,0.45)] p-5 backdrop-blur"
						>
							<div className="text-sm font-medium">
								What you’ll get
							</div>
							<ul className="mt-3 space-y-2 text-sm text-[rgba(233,221,199,0.75)]">
								<li>
									• ATS-friendly structure + keyword alignment
								</li>
								<li>• LaTeX source you can keep and edit</li>
								<li>
									• Versioned results for each job posting
								</li>
								<li>• Export-ready PDF from your dashboard</li>
							</ul>

							<div className="mt-5 rounded-xl border border-[rgba(233,221,199,0.12)] bg-[rgba(233,221,199,0.04)] p-4">
								<div className="text-xs text-[rgba(233,221,199,0.65)]">
									Credits
								</div>
								<div className="mt-1 text-lg font-semibold">
									3 free credits
								</div>
								<div className="mt-1 text-xs text-[rgba(233,221,199,0.6)]">
									Preview is free. Download uses 1 credit.
								</div>
							</div>

							<div className="mt-4 text-xs text-[rgba(233,221,199,0.6)]">
								Tip: Add measurable impact (“reduced latency by
								32%”) to boost your score.
							</div>
						</motion.div>
					</div>
				</div>
			</main>

			<SignupGateModal
				open={showGate}
				onClose={() => setShowGate(false)}
				onContinue={() => {
					// In your real app: start auth, then call exportPdf after session exists.
					alert(
						"Hook this up to your auth (NextAuth). After login, call exportPdf()."
					);
					setShowGate(false);
				}}
			/>
		</div>
	);
}
