"use client";

import { useEffect, useState, useCallback } from "react";
import { ResumeMode } from "../ModeCards";
import { AnalyzeResult, ExportResult, Step } from "../types";
import { loadDraft, saveDraft, clearDraft } from "@/lib/storage/draft";

export function useResumeForm() {
	const [step, setStep] = useState<Step>(0);
	const [mode, setMode] = useState<ResumeMode>("QUICK");

	const [jobDescription, setJobDescription] = useState("");
	const [resumeFile, setResumeFile] = useState<File | null>(null);
	const [focusPrompt, setFocusPrompt] = useState("");

	const [isAnalyzing, setIsAnalyzing] = useState(false);
	const [analysis, setAnalysis] = useState<AnalyzeResult | null>(null);

	const [showGate, setShowGate] = useState(false);
	const [isExporting, setIsExporting] = useState(false);
	const [exportResult, setExportResult] = useState<ExportResult | null>(null);

	// Draft persistence (anonymous-friendly)
	// Note: We don't persist the file itself, only metadata
	useEffect(() => {
		const d = loadDraft();
		if (!d) return;
		setMode(d.mode ?? "QUICK");
		setJobDescription(d.jobDescription ?? "");
		setFocusPrompt(d.focusPrompt ?? "");
		if (d.step !== undefined) setStep(d.step);
	}, []);

	useEffect(() => {
		saveDraft({
			step,
			mode,
			jobDescription,
			// Don't save file to localStorage, only save that a file was present
			resumeFileName: resumeFile?.name ?? null,
			focusPrompt,
			analysis,
		});
	}, [step, mode, jobDescription, resumeFile, focusPrompt, analysis]);

	const canContinueFromStep0 = !!mode;
	const canAnalyze =
		jobDescription.trim().length > 50 &&
		resumeFile !== null &&
		!isAnalyzing;

	const runAnalyze = useCallback(async () => {
		if (!resumeFile) return;
		
		setIsAnalyzing(true);
		setExportResult(null);
		try {
			// Create FormData to send file
			const formData = new FormData();
			formData.append("mode", mode);
			formData.append("jobDescription", jobDescription);
			formData.append("resumeFile", resumeFile);
			formData.append("focusPrompt", focusPrompt);

			const res = await fetch("/api/analyze", {
				method: "POST",
				body: formData,
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
	}, [mode, jobDescription, resumeFile, focusPrompt]);

	// Stub: replace with your auth state (NextAuth session)
	const isLoggedIn = false;

	const exportPdf = useCallback(async () => {
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
			const data = (await res.json()) as ExportResult;
			setExportResult(data);
		} catch (e) {
			console.error(e);
			alert("Export failed. Please try again.");
		} finally {
			setIsExporting(false);
		}
	}, [analysis, isLoggedIn]);

	const resetAll = useCallback(() => {
		setStep(0);
		setMode("QUICK");
		setJobDescription("");
		setResumeFile(null);
		setFocusPrompt("");
		setAnalysis(null);
		setExportResult(null);
		clearDraft();
	}, []);

	return {
		// Step state
		step,
		setStep,
		
		// Mode state
		mode,
		setMode,
		
		// Form fields
		jobDescription,
		setJobDescription,
		resumeFile,
		setResumeFile,
		focusPrompt,
		setFocusPrompt,
		
		// Analysis state
		isAnalyzing,
		analysis,
		
		// Export state
		showGate,
		setShowGate,
		isExporting,
		exportResult,
		
		// Computed values
		canContinueFromStep0,
		canAnalyze,
		
		// Actions
		runAnalyze,
		exportPdf,
		resetAll,
	};
}
