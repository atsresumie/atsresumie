"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { ResumeMode } from "../ModeCards";
import { AnalyzeResult, ExportResult, Step } from "../types";
import { loadDraft, saveDraft, clearDraft } from "@/lib/storage/draft";
import {
	startOnboardingSession,
	getSessionStatus,
	startNewSession,
	uploadResume,
	saveDraft as saveOnboardingDraft,
	SessionStatusResult,
} from "@/lib/onboarding/client";

interface UploadedResume {
	bucket: string;
	objectPath: string;
	originalFilename: string;
	mimeType: string;
	sizeBytes: number;
}

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

	// Onboarding session state
	const [sessionId, setSessionId] = useState<string | null>(null);
	const [isUploadingResume, setIsUploadingResume] = useState(false);
	const [uploadedResume, setUploadedResume] = useState<UploadedResume | null>(null);
	const [isLoadingSession, setIsLoadingSession] = useState(true);
	const [isSessionLocked, setIsSessionLocked] = useState(false);
	const [hasPreviousDraft, setHasPreviousDraft] = useState(false);
	const [previousResumeFilename, setPreviousResumeFilename] = useState<string | null>(null);
	const sessionInitRef = useRef(false);

	// Initialize onboarding session on mount and restore draft if exists
	useEffect(() => {
		if (sessionInitRef.current) return;
		sessionInitRef.current = true;

		async function initSession() {
			setIsLoadingSession(true);
			try {
				// First, check if there's an existing session with draft
				const status = await getSessionStatus();

				if (status) {
					setSessionId(status.sessionId);
					console.log("Existing session found:", status.sessionId, "Status:", status.status);

					// Check if session is locked (claimed or expired)
					if (!status.isEditable) {
						setIsSessionLocked(true);
						console.log("Session is locked (claimed/expired)");
						toast.warning("Previous session completed", {
							description: "Start a new session to create another resume.",
						});
					}

					// Restore draft data if exists
					if (status.draft) {
						setHasPreviousDraft(true);
						setJobDescription(status.draft.jdText);
						setPreviousResumeFilename(status.draft.resumeOriginalFilename);
						
						// If we have resume info from server, set uploadedResume state
						if (status.draft.resumeBucket && status.draft.resumeObjectPath) {
							setUploadedResume({
								bucket: status.draft.resumeBucket,
								objectPath: status.draft.resumeObjectPath,
								originalFilename: status.draft.resumeOriginalFilename || "resume",
								mimeType: "application/pdf", // Default
								sizeBytes: 0,
							});
						}

						console.log("Restored draft from server:", {
							jdLength: status.draft.jdText.length,
							resumeFilename: status.draft.resumeOriginalFilename,
						});
						toast.info("Previous session restored", {
							description: "Your job description has been restored.",
						});
					}
				} else {
					// No existing session, start a new one
					const id = await startOnboardingSession();
					setSessionId(id);
					console.log("New onboarding session started:", id);
				}
			} catch (err) {
				console.error("Failed to initialize session:", err);
				// Try to start a fresh session as fallback
				try {
					const id = await startOnboardingSession();
					setSessionId(id);
				} catch {
					// Non-blocking - the app still works
				}
			} finally {
				setIsLoadingSession(false);
			}
		}

		initSession();
	}, []);

	// Function to start a fresh session (clear old one and start new)
	const startFreshSession = useCallback(async () => {
		setIsLoadingSession(true);
		try {
			const id = await startNewSession();
			setSessionId(id);
			setIsSessionLocked(false);
			setHasPreviousDraft(false);
			setPreviousResumeFilename(null);
			setJobDescription("");
			setResumeFile(null);
			setUploadedResume(null);
			setFocusPrompt("");
			setAnalysis(null);
			setExportResult(null);
			setStep(0);
			clearDraft();
			console.log("Fresh session started:", id);
			toast.success("New session started");
		} catch (err) {
			console.error("Failed to start fresh session:", err);
			toast.error("Failed to start new session");
		} finally {
			setIsLoadingSession(false);
		}
	}, []);

	// Draft persistence (anonymous-friendly localStorage backup)
	useEffect(() => {
		const d = loadDraft();
		if (!d) return;
		setMode(d.mode ?? "QUICK");
		setJobDescription(d.jobDescription ?? "");
		setFocusPrompt(d.focusPrompt ?? "");
		if (d.analysis) setAnalysis(d.analysis);
		if (d.step !== undefined) setStep(d.step);
	}, []);

	useEffect(() => {
		saveDraft({
			step,
			mode,
			jobDescription,
			resumeFileName: resumeFile?.name ?? null,
			focusPrompt,
			analysis,
		});
	}, [step, mode, jobDescription, resumeFile, focusPrompt, analysis]);

	const canContinueFromStep0 = !!mode;
	const canAnalyze =
		jobDescription.trim().length > 50 &&
		resumeFile !== null &&
		!isAnalyzing &&
		!isUploadingResume;

	// Log validation errors to console for debugging
	useEffect(() => {
		if (!canAnalyze) {
			const errors: string[] = [];
			if (jobDescription.trim().length <= 50) {
				errors.push(`Job description too short: ${jobDescription.trim().length}/50 characters required`);
			}
			if (resumeFile === null) {
				errors.push("No resume file uploaded");
			}
			if (isAnalyzing) {
				errors.push("Analysis already in progress");
			}
			if (isUploadingResume) {
				errors.push("Resume upload in progress");
			}
			if (errors.length > 0) {
				console.warn("Cannot analyze - validation errors:", errors);
			}
		}
	}, [canAnalyze, jobDescription, resumeFile, isAnalyzing, isUploadingResume]);

	// Handle resume file change - upload to Supabase Storage
	const handleResumeFileChange = useCallback(async (file: File | null) => {
		setResumeFile(file);
		setUploadedResume(null);

		if (!file) return;

		// Upload to Supabase Storage
		setIsUploadingResume(true);
		try {
			const result = await uploadResume(file);
			setUploadedResume({
				bucket: result.bucket,
				objectPath: result.objectPath,
				originalFilename: file.name,
				mimeType: file.type,
				sizeBytes: file.size,
			});
			console.log("Resume uploaded to:", result.objectPath);
			toast.success("Resume uploaded", {
				description: "Your resume has been securely uploaded.",
			});
		} catch (err) {
			console.error("Failed to upload resume:", err);
			toast.error("Upload failed", {
				description: err instanceof Error ? err.message : "Please try again.",
			});
			// Reset file on upload failure
			setResumeFile(null);
		} finally {
			setIsUploadingResume(false);
		}
	}, []);

	const runAnalyze = useCallback(async () => {
		if (!resumeFile) {
			toast.warning("Resume file required", {
				description: "Please re-upload your resume to regenerate the analysis.",
			});
			setStep(1);
			return;
		}
		
		setIsAnalyzing(true);
		setExportResult(null);
		try {
			// Save draft to Supabase if we have an uploaded resume
			if (uploadedResume && sessionId) {
				try {
					const draftId = await saveOnboardingDraft({
						jdText: jobDescription,
						jdTitle: undefined, // Could extract from JD later
						jdCompany: undefined, // Could extract from JD later
						resumeBucket: uploadedResume.bucket,
						resumeObjectPath: uploadedResume.objectPath,
						resumeOriginalFilename: uploadedResume.originalFilename,
						resumeMimeType: uploadedResume.mimeType,
						resumeSizeBytes: uploadedResume.sizeBytes,
					});
					console.log("Draft saved to Supabase:", draftId);
				} catch (err) {
					console.error("Failed to save draft to Supabase:", err);
					// Non-blocking - continue with analysis
				}
			}

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
			toast.error("Analysis failed", {
				description: "Something went wrong. Please try again.",
			});
		} finally {
			setIsAnalyzing(false);
		}
	}, [mode, jobDescription, resumeFile, focusPrompt, uploadedResume, sessionId]);

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
		setUploadedResume(null);
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
		setResumeFile: handleResumeFileChange,
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
		
		// Onboarding state
		sessionId,
		isUploadingResume,
		uploadedResume,
		isLoadingSession,
		isSessionLocked,
		hasPreviousDraft,
		previousResumeFilename,
		
		// Computed values
		canContinueFromStep0,
		canAnalyze,
		
		// Actions
		runAnalyze,
		exportPdf,
		resetAll,
		startFreshSession,
	};
}
