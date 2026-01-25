"use client";

import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";

import AnimatedBackground from "@/components/get-started/AnimatedBackground";
import Stepper from "@/components/get-started/Stepper";
import SignupGateModal from "@/components/get-started/SignupGateModal";
import TopNav from "@/components/get-started/TopNav";
import SidePanel from "@/components/get-started/SidePanel";
import {
	Step0ModeSelection,
	Step1InputForm,
	Step2Preview,
} from "@/components/get-started/steps";
import { useResumeForm } from "@/components/get-started/hooks/useResumeForm";
import { STEPS } from "@/components/get-started/types";

export default function GetStartedPage() {
	const reduceMotion = useReducedMotion();
	const form = useResumeForm();

	const headline = useMemo(() => {
		if (form.step === 0) return "Choose your optimization mode";
		if (form.step === 1) return "Paste your job + resume";
		return "Preview your ATS-ready result";
	}, [form.step]);

	return (
		<div className="min-h-screen bg-[#1a120e] text-[#E9DDC7]">
			<AnimatedBackground />

			<TopNav onReset={form.resetAll} />

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
						<Stepper steps={[...STEPS]} current={form.step} />
					</div>
				</div>

				{/* Content */}
				<div className="mt-8 grid gap-6 md:grid-cols-12">
					{/* Left panel */}
					<div className="md:col-span-7">
						<div className="rounded-2xl border border-[rgba(233,221,199,0.12)] bg-[rgba(20,14,11,0.55)] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.35)] backdrop-blur">
							{form.step === 0 && (
								<Step0ModeSelection
									mode={form.mode}
									onModeChange={form.setMode}
									canContinue={form.canContinueFromStep0}
									onContinue={() => form.setStep(1)}
								/>
							)}

							{form.step === 1 && (
								<Step1InputForm
									jobDescription={form.jobDescription}
									onJobDescriptionChange={
										form.setJobDescription
									}
									resumeFile={form.resumeFile}
									onResumeFileChange={form.setResumeFile}
									focusPrompt={form.focusPrompt}
									onFocusPromptChange={form.setFocusPrompt}
									canAnalyze={form.canAnalyze}
									isAnalyzing={form.isAnalyzing}
									isUploadingResume={form.isUploadingResume}
									isDeletingResume={form.isDeletingResume}
									previousResumeFilename={
										form.previousResumeFilename
									}
									onClearResume={form.clearUploadedResume}
									onBack={() => form.setStep(0)}
									onAnalyze={form.runAnalyze}
									// Upload progress props (soft-commit flow)
									uploadState={form.uploadState}
									uploadProgress={form.uploadProgress}
									uploadedBytes={form.uploadedBytes}
									totalBytes={form.totalBytes}
									estimatedSecondsRemaining={
										form.estimatedSecondsRemaining
									}
									uploadError={form.uploadError}
									onCancelUpload={form.cancelUpload}
									onRetryUpload={form.retryUpload}
								/>
							)}

							{form.step === 2 && form.analysis && (
								<Step2Preview
									analysis={form.analysis}
									exportResult={form.exportResult}
									isExporting={form.isExporting}
									onEditInputs={() => form.setStep(1)}
									onExport={form.exportPdf}
								/>
							)}
						</div>
					</div>

					{/* Right panel */}
					<div className="md:col-span-5">
						<SidePanel />
					</div>
				</div>
			</main>

			<SignupGateModal
				open={form.showGate}
				onClose={() => form.setShowGate(false)}
				onAuthSuccess={() => {
					// After successful auth, trigger PDF export
					form.setShowGate(false);
					form.exportPdf();
				}}
			/>
		</div>
	);
}
