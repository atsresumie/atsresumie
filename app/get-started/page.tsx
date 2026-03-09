"use client";

import { useEffect } from "react";

import AnimatedBackground from "@/components/get-started/AnimatedBackground";
import SignupGateModal from "@/components/get-started/SignupGateModal";
import TopNav from "@/components/get-started/TopNav";
import SidePanel from "@/components/get-started/SidePanel";
import ModeCards from "@/components/get-started/ModeCards";
import { Step1InputForm, Step2Preview } from "@/components/get-started/steps";
import { useResumeForm } from "@/components/get-started/hooks/useResumeForm";

export default function GetStartedPage() {
	const form = useResumeForm();

	useEffect(() => {
		if (form.step === 0) {
			form.setStep(1);
		}
	}, [form]);

	return (
		<div className="min-h-screen bg-[#1a120e] text-[#E9DDC7]">
			<AnimatedBackground />

			<TopNav onReset={form.resetAll} />

			<main className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-20">
				<div className="flex flex-col gap-4 pt-6">
					<div className="max-w-2xl">
						<h1 className="text-balance text-3xl font-semibold tracking-tight md:text-4xl">
							Set up your resume tailoring
						</h1>
						<p className="mt-2 text-sm text-[rgba(233,221,199,0.75)] md:text-base">
							Upload your resume, paste the job description, and we&apos;ll tailor it.
						</p>
					</div>
				</div>

				<div className="mt-8 grid gap-6 md:grid-cols-12">
					<div className="md:col-span-7 space-y-4">
						<div className="rounded-2xl border border-[rgba(233,221,199,0.12)] bg-[rgba(20,14,11,0.55)] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur">
							<div className="mb-4 text-sm text-[rgba(233,221,199,0.75)]">
								Choose your mode
							</div>
							<ModeCards value={form.mode} onChange={form.setMode} />
						</div>

						<div className="rounded-2xl border border-[rgba(233,221,199,0.12)] bg-[rgba(20,14,11,0.55)] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur">
							{form.step !== 2 ? (
								<Step1InputForm
									jobDescription={form.jobDescription}
									onJobDescriptionChange={form.setJobDescription}
									resumeFile={form.resumeFile}
									onResumeFileChange={form.setResumeFile}
									focusPrompt={form.focusPrompt}
									onFocusPromptChange={form.setFocusPrompt}
									canAnalyze={form.canAnalyze}
									isAnalyzing={form.isAnalyzing}
									isUploadingResume={form.isUploadingResume}
									isDeletingResume={form.isDeletingResume}
									previousResumeFilename={form.previousResumeFilename}
									onClearResume={form.clearUploadedResume}
									onBack={() => undefined}
									onAnalyze={form.runAnalyze}
									uploadState={form.uploadState}
									uploadProgress={form.uploadProgress}
									uploadedBytes={form.uploadedBytes}
									totalBytes={form.totalBytes}
									estimatedSecondsRemaining={form.estimatedSecondsRemaining}
									uploadError={form.uploadError}
									onCancelUpload={form.cancelUpload}
									onRetryUpload={form.retryUpload}
									hideBackButton
								/>
							) : (
								(form.analysis || form.generatedLatex) && (
									<Step2Preview
										analysis={form.analysis}
										latexText={form.generatedLatex}
										exportResult={form.exportResult}
										isExporting={form.isExporting}
										onEditInputs={() => form.setStep(1)}
										onExport={form.exportPdf}
										generationJobId={form.generationJobId}
									/>
								)
							)}
						</div>
					</div>

					<div className="md:col-span-5">
						<SidePanel />
					</div>
				</div>
			</main>

			<SignupGateModal
				open={form.showGate}
				onClose={() => form.setShowGate(false)}
				onAuthSuccess={() => {
					form.setShowGate(false);
					form.runAnalyze();
				}}
			/>
		</div>
	);
}
