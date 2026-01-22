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
	deleteResume,
	saveDraft as saveOnboardingDraft,
	claimSession,
	SessionStatusResult,
} from "@/lib/onboarding/client";
import { useAuth } from "@/hooks/useAuth";

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
	const [showSuccessModal, setShowSuccessModal] = useState(false);

	// Onboarding session state
	const [sessionId, setSessionId] = useState<string | null>(null);
	const [isUploadingResume, setIsUploadingResume] = useState(false);
	const [uploadedResume, setUploadedResume] = useState<UploadedResume | null>(
		null,
	);
	const [isLoadingSession, setIsLoadingSession] = useState(true);
	const [isSessionLocked, setIsSessionLocked] = useState(false);
	const [hasPreviousDraft, setHasPreviousDraft] = useState(false);
	const [previousResumeFilename, setPreviousResumeFilename] = useState<
		string | null
	>(null);
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
					console.log(
						"Existing session found:",
						status.sessionId,
						"Status:",
						status.status,
					);

					// Check if session is locked (claimed or expired)
					if (!status.isEditable) {
						setIsSessionLocked(true);
						console.log("Session is locked (claimed/expired)");
						toast.warning("Previous session completed", {
							description:
								"Start a new session to create another resume.",
						});
					}

					// Restore draft data if exists
					if (status.draft) {
						setHasPreviousDraft(true);
						setJobDescription(status.draft.jdText);
						setPreviousResumeFilename(
							status.draft.resumeOriginalFilename,
						);

						// If we have resume info from server, set uploadedResume state
						if (
							status.draft.resumeBucket &&
							status.draft.resumeObjectPath
						) {
							setUploadedResume({
								bucket: status.draft.resumeBucket,
								objectPath: status.draft.resumeObjectPath,
								originalFilename:
									status.draft.resumeOriginalFilename ||
									"resume",
								mimeType: "application/pdf", // Default
								sizeBytes: 0,
							});
						}

						console.log("Restored draft from server:", {
							jdLength: status.draft.jdText.length,
							resumeFilename: status.draft.resumeOriginalFilename,
						});
						toast.info("Previous session restored", {
							description:
								"Your job description has been restored.",
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

	// Function to delete uploaded resume from server and clear local state
	const [isDeletingResume, setIsDeletingResume] = useState(false);

	const clearUploadedResume = useCallback(async () => {
		// If we have uploaded resume info, delete from server
		if (uploadedResume) {
			setIsDeletingResume(true);
			try {
				await deleteResume(
					uploadedResume.bucket,
					uploadedResume.objectPath,
				);
				console.log(
					"Resume deleted from server:",
					uploadedResume.objectPath,
				);
				toast.success("Resume removed");
			} catch (err) {
				console.error("Failed to delete resume:", err);
				toast.error("Failed to delete resume from server");
				// Continue anyway to clear local state
			} finally {
				setIsDeletingResume(false);
			}
		}

		// Clear local state
		setResumeFile(null);
		setUploadedResume(null);
		setHasPreviousDraft(false);
		setPreviousResumeFilename(null);
	}, [uploadedResume]); // Draft persistence (anonymous-friendly localStorage backup)
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

	// Allow analysis if we have either:
	// 1. A fresh file just uploaded (resumeFile !== null)
	// 2. A previously uploaded resume from restored session (uploadedResume !== null)
	const hasResumeForAnalysis = resumeFile !== null || uploadedResume !== null;

	const canAnalyze =
		jobDescription.trim().length > 50 &&
		hasResumeForAnalysis &&
		!isAnalyzing &&
		!isUploadingResume;

	// Log validation errors to console for debugging
	useEffect(() => {
		if (!canAnalyze) {
			const errors: string[] = [];
			if (jobDescription.trim().length <= 50) {
				errors.push(
					`Job description too short: ${jobDescription.trim().length}/50 characters required`,
				);
			}
			if (!hasResumeForAnalysis) {
				errors.push(
					"No resume file (upload one or use restored resume)",
				);
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
	}, [
		canAnalyze,
		jobDescription,
		hasResumeForAnalysis,
		isAnalyzing,
		isUploadingResume,
	]);

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
				description:
					err instanceof Error ? err.message : "Please try again.",
			});
			// Reset file on upload failure
			setResumeFile(null);
		} finally {
			setIsUploadingResume(false);
		}
	}, []);

	const runAnalyze = useCallback(async () => {
		// Check if we have a resume - either fresh upload or from server
		if (!resumeFile && !uploadedResume) {
			toast.warning("Resume file required", {
				description: "Please upload your resume to run the analysis.",
			});
			setStep(1);
			return;
		}

		setIsAnalyzing(true);
		setExportResult(null);
		try {
			// Save draft to Supabase if we have an uploaded resume and session is still active
			if (uploadedResume && sessionId && !isSessionLocked) {
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
					console.warn(
						"Draft save skipped (session may be claimed):",
						err,
					);
					// Non-blocking - continue with analysis
				}
			}

			// Create FormData to send file or storage reference
			const formData = new FormData();
			formData.append("mode", mode);
			formData.append("jobDescription", jobDescription);
			formData.append("focusPrompt", focusPrompt);

			if (resumeFile) {
				// Fresh file upload
				formData.append("resumeFile", resumeFile);
			} else if (uploadedResume) {
				// Use stored resume from server
				formData.append("resumeBucket", uploadedResume.bucket);
				formData.append("resumeObjectPath", uploadedResume.objectPath);
			}

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
	}, [
		mode,
		jobDescription,
		resumeFile,
		focusPrompt,
		uploadedResume,
		sessionId,
		isSessionLocked,
	]);

	// Use real auth state from useAuth hook
	const { isAuthenticated } = useAuth();

	// Job polling state
	const [currentJobId, setCurrentJobId] = useState<string | null>(null);
	const pollingRef = useRef<NodeJS.Timeout | null>(null);

	// Poll job status
	const pollJobStatus = useCallback(async (jobId: string) => {
		try {
			const res = await fetch(`/api/jobs/${jobId}`);
			if (!res.ok) {
				throw new Error("Failed to fetch job status");
			}
			const job = await res.json();

			if (job.status === "succeeded") {
				// Stop polling
				if (pollingRef.current) {
					clearInterval(pollingRef.current);
					pollingRef.current = null;
				}
				setCurrentJobId(null);
				setIsExporting(false);
				setExportResult({ pdfUrl: job.pdfUrl, latex: "" });
				setShowSuccessModal(true); // Show success modal instead of toast
			} else if (job.status === "failed") {
				// Stop polling
				if (pollingRef.current) {
					clearInterval(pollingRef.current);
					pollingRef.current = null;
				}
				setCurrentJobId(null);
				setIsExporting(false);
				toast.error("Generation failed", {
					description: job.errorMessage || "Please try again.",
				});
			}
			// Continue polling for pending/running
		} catch (err) {
			console.error("Job polling error:", err);
		}
	}, []);

	// Cleanup polling on unmount
	useEffect(() => {
		return () => {
			if (pollingRef.current) {
				clearInterval(pollingRef.current);
			}
		};
	}, []);

	const exportPdf = useCallback(async () => {
		if (!analysis) return;

		// Gate download behind login
		if (!isAuthenticated) {
			setShowGate(true);
			return;
		}

		setIsExporting(true);
		try {
			// Only try to claim if session is not already locked
			if (sessionId && !isSessionLocked) {
				try {
					await claimSession();
					setIsSessionLocked(true); // Prevent future claim attempts
					console.log("Session claimed successfully");
				} catch (err) {
					console.warn("Session claim skipped:", err);
				}
			}

			// Create generation job
			const res = await fetch("/api/generate", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					jdText: jobDescription,
					resumeObjectPath: uploadedResume?.objectPath || null,
					focusPrompt: focusPrompt || null,
				}),
			});

			if (!res.ok) {
				const errorData = await res.json().catch(() => ({}));

				// Handle insufficient credits
				if (res.status === 402 || errorData.code === "NO_CREDITS") {
					toast.error("No credits remaining", {
						description:
							"You've used all your credits. Upgrade to generate more resumes.",
					});
					setIsExporting(false);
					return;
				}

				toast.error("Generation failed", {
					description: "Please try again.",
				});
				setIsExporting(false);
				return;
			}

			const { jobId } = await res.json();
			setCurrentJobId(jobId);

			// Start polling for job status
			pollingRef.current = setInterval(() => {
				pollJobStatus(jobId);
			}, 1000);

			// Initial poll
			pollJobStatus(jobId);
		} catch (e) {
			console.error(e);
			setIsExporting(false);
			toast.error("Generation failed", {
				description: "Please try again.",
			});
		}
	}, [
		analysis,
		isAuthenticated,
		sessionId,
		jobDescription,
		uploadedResume,
		focusPrompt,
		pollJobStatus,
	]);

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

	const handleCreateAnother = useCallback(async () => {
		setShowSuccessModal(false);
		resetAll();
		await startFreshSession();
		toast.info("Started new session");
	}, [resetAll, startFreshSession]);

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
		isDeletingResume,

		// Computed values
		canContinueFromStep0,
		canAnalyze,

		// Actions
		runAnalyze,
		exportPdf,
		resetAll,
		startFreshSession,
		clearUploadedResume,

		// Success Modal
		showSuccessModal,
		setShowSuccessModal,
		handleCreateAnother,
	};
}
