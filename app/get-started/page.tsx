"use client";

import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";

import AnimatedBackground from "@/components/get-started/AnimatedBackground";
import SignupGateModal from "@/components/get-started/SignupGateModal";
import TopNav from "@/components/get-started/TopNav";
import SidePanel from "@/components/get-started/SidePanel";
import {
	Step0ModeSelection,
	Step1InputForm,
	Step2Preview,
} from "@/components/get-started/steps";
import { useResumeForm } from "@/components/get-started/hooks/useResumeForm";

export default function GetStartedPage() {
	const reduceMotion = useReducedMotion();
	const form = useResumeForm();

	const isPreviewStep = form.step === 2 && (form.analysis || form.generatedLatex);

	return (
		<div className="min-h-screen bg-surface-base text-text-primary">
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
							{isPreviewStep
								? "Your tailored resume"
								: "Set up your resume"}
						</motion.h1>
						<p className="mt-2 text-sm text-text-secondary md:text-base">
							{isPreviewStep
								? "Here's what we generated — download or customize it."
								: "Pick a mode, paste the job posting, and upload your resume."}
						</p>
					</div>
				</div>

				{/* Content */}
				<div className="mt-8 grid gap-6 md:grid-cols-12">
					{/* Left panel */}
					<div className="md:col-span-7">
						<div className="rounded-2xl border border-border-visible bg-surface-raised p-5 shadow-card backdrop-blur">
							{isPreviewStep ? (
								<Step2Preview
									analysis={form.analysis}
									latexText={form.generatedLatex}
									exportResult={form.exportResult}
									isExporting={form.isExporting}
									onEditInputs={() => form.setStep(0)}
									onExport={form.exportPdf}
									generationJobId={form.generationJobId}
								/>
							) : (
								<>
									{/* Mode selection inline */}
									<Step0ModeSelection
										mode={form.mode}
										onModeChange={form.setMode}
									/>

									{/* Divider */}
									<div className="my-5 border-t border-border-subtle" />

									{/* Input form */}
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
										onBack={() => {}}
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
								</>
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
					// After successful auth, resume generation (not export)
					form.setShowGate(false);
					form.runAnalyze();
				}}
			/>
		</div>
	);
}
