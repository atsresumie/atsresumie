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
	commitResume,
	SessionStatusResult,
	UploadProgress,
} from "@/lib/onboarding/client";
import { useAuth } from "@/hooks/useAuth";
import { useJobRealtime } from "@/hooks/useJobRealtime";

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

	// LaTeX generation state (from Claude via Realtime)
	const [generatedLatex, setGeneratedLatex] = useState<string | null>(null);
	const [generationJobId, setGenerationJobId] = useState<string | null>(null);

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

	// Upload progress state for soft-commit flow
	type UploadState =
		| "idle"
		| "preparing"
		| "uploading"
		| "uploaded_temp"
		| "uploaded_final"
		| "error";
	const [uploadState, setUploadState] = useState<UploadState>("idle");
	const [uploadProgress, setUploadProgress] = useState(0);
	const [uploadedBytes, setUploadedBytes] = useState(0);
	const [totalBytes, setTotalBytes] = useState(0);
	const [estimatedSecondsRemaining, setEstimatedSecondsRemaining] = useState<
		number | undefined
	>();
	const [uploadError, setUploadError] = useState<string | null>(null);
	const uploadAbortRef = useRef<AbortController | null>(null);
	const pendingFileRef = useRef<File | null>(null); // For retry functionality

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
					// Check if session is locked (claimed or expired)
					if (!status.isEditable) {
						setIsSessionLocked(true);
						// For authenticated users, automatically start a new session
						if (isAuthenticated) {
							try {
								const newId = await startNewSession();
								setSessionId(newId);
								setIsSessionLocked(false);
								setHasPreviousDraft(false);
								setPreviousResumeFilename(null);
								toast.info("Started fresh session", {
									description:
										"You can create a new resume now.",
								});
								return; // Skip draft restoration
							} catch (err) {
								console.error(
									"Failed to auto-start new session:",
									err,
								);
								toast.warning("Previous session completed", {
									description:
										"Click Reset to start a new session.",
								});
							}
						} else {
							// For non-authenticated, show the warning
							toast.warning("Previous session completed", {
								description:
									"Start a new session to create another resume.",
							});
						}
					}

					// Restore draft data only if session is still editable (not claimed)
					if (status.draft && status.isEditable) {
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
						toast.info("Previous session restored", {
							description:
								"Your job description has been restored.",
						});
					}
				}
				// If no session exists, do NOT create one preemptively.
				// Session will be created on-demand when user uploads a resume.
			} catch (err) {
				console.error("Failed to initialize session:", err);
				// Non-blocking - the app still works without a session initially
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
		// Only save draft if there's actual user input to persist
		// This prevents creating empty drafts on initial page load
		const hasUserInput =
			jobDescription.trim().length > 0 ||
			resumeFile !== null ||
			focusPrompt.trim().length > 0 ||
			analysis !== null;

		if (hasUserInput) {
			saveDraft({
				step,
				mode,
				jobDescription,
				resumeFileName: resumeFile?.name ?? null,
				focusPrompt,
				analysis,
			});
		}
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

	// Handle resume file change - upload to Supabase Storage with progress tracking
	const handleResumeFileChange = useCallback(
		async (file: File | null) => {
			// Cancel any in-progress upload
			if (uploadAbortRef.current) {
				uploadAbortRef.current.abort();
				uploadAbortRef.current = null;
			}

			// Reset state
			setResumeFile(file);
			setUploadProgress(0);
			setUploadedBytes(0);
			setTotalBytes(0);
			setEstimatedSecondsRemaining(undefined);
			setUploadError(null);

			if (!file) {
				setUploadState("idle");
				setUploadedResume(null);
				return;
			}

			// Store file for retry
			pendingFileRef.current = file;
			setTotalBytes(file.size);

			// Delete previous temp file if exists (file replacement scenario)
			if (
				uploadedResume &&
				uploadedResume.objectPath.includes("/temp/")
			) {
				try {
					await deleteResume(
						uploadedResume.bucket,
						uploadedResume.objectPath,
					);
				} catch (err) {
					console.warn(
						"Failed to delete previous temp file (non-critical):",
						err,
					);
				}
			}
			setUploadedResume(null);

			// Start upload
			setUploadState("preparing");
			setIsUploadingResume(true);

			const abortController = new AbortController();
			uploadAbortRef.current = abortController;

			try {
				// Create session on-demand if not already created (required for upload URL)
				let currentSessionId = sessionId;
				if (!currentSessionId) {
					try {
						currentSessionId = await startOnboardingSession();
						setSessionId(currentSessionId);
					} catch (err) {
						console.error("Failed to create session:", err);
						setUploadError("Failed to initialize session");
						setUploadState("error");
						setIsUploadingResume(false);
						toast.error("Upload failed", {
							description:
								"Could not initialize session. Please try again.",
						});
						return;
					}
				}

				setUploadState("uploading");
				const result = await uploadResume(file, {
					signal: abortController.signal,
					onProgress: (progress) => {
						setUploadProgress(progress.percentage);
						setUploadedBytes(progress.loaded);
						setTotalBytes(progress.total);
						setEstimatedSecondsRemaining(
							progress.estimatedSecondsRemaining,
						);
					},
				});

				// Upload succeeded - set state and save draft with temp status
				const uploadedResumeData = {
					bucket: result.bucket,
					objectPath: result.objectPath,
					originalFilename: result.originalFilename,
					mimeType: file.type,
					sizeBytes: file.size,
				};
				setUploadedResume(uploadedResumeData);
				setUploadState("uploaded_temp");
				setUploadProgress(100);
				toast.success("Resume uploaded", {
					description:
						"Ready for analysis. Click 'Preview & Analyze' to confirm.",
				});

				// Save draft with temp resume info (non-blocking)
				// Session is guaranteed to exist at this point (created above)
				if (currentSessionId && !isSessionLocked) {
					try {
						await saveOnboardingDraft({
							jdText: jobDescription || " ", // Placeholder if empty
							resumeBucket: result.bucket,
							resumeObjectPath: result.objectPath,
							resumeOriginalFilename: result.originalFilename,
							resumeMimeType: file.type,
							resumeSizeBytes: file.size,
							resumeStatus: "temp",
						});
					} catch (err) {
						console.warn(
							"Non-critical: Failed to save draft:",
							err,
						);
					}
				}
			} catch (err) {
				// Handle cancellation
				if (
					err instanceof Error &&
					err.message === "Upload cancelled"
				) {
					setUploadState("idle");
					setResumeFile(null);
					return;
				}

				// Handle error
				console.error("Failed to upload resume:", err);
				const errorMessage =
					err instanceof Error ? err.message : "Please try again.";
				setUploadError(errorMessage);
				setUploadState("error");
				toast.error("Upload failed", { description: errorMessage });
			} finally {
				setIsUploadingResume(false);
				uploadAbortRef.current = null;
			}
		},
		[uploadedResume, sessionId, isSessionLocked, jobDescription],
	);

	// Cancel upload function
	const cancelUpload = useCallback(() => {
		if (uploadAbortRef.current) {
			uploadAbortRef.current.abort();
			uploadAbortRef.current = null;
		}
	}, []);

	// Retry upload function
	const retryUpload = useCallback(() => {
		if (pendingFileRef.current) {
			handleResumeFileChange(pendingFileRef.current);
		}
	}, [handleResumeFileChange]);

	// Realtime subscription for generation job updates
	const {
		subscribe: subscribeToJob,
		unsubscribe: unsubscribeFromJob,
		status: jobRealtimeStatus,
		latexText: realtimeLatexText,
		errorMessage: realtimeErrorMessage,
	} = useJobRealtime({
		onProcessing: () => {},
		onSuccess: (latex) => {
			setGeneratedLatex(latex);
			setIsAnalyzing(false);
			setStep(2);
			toast.success("Resume generated!", {
				description: "Your tailored resume is ready for preview.",
			});
		},
		onError: (msg) => {
			console.error("[Realtime] Job failed:", msg);
			setIsAnalyzing(false);
			toast.error("Generation failed", {
				description: msg || "Please try again.",
			});
		},
	});

	// Ref to track if analyze request has been cancelled/timed out
	const analyzeAbortRef = useRef<AbortController | null>(null);
	const analyzeTimedOutRef = useRef(false);

	const runAnalyze = useCallback(async () => {
		// Check if we have a resume - either fresh upload or from server
		if (!resumeFile && !uploadedResume) {
			toast.warning("Resume file required", {
				description: "Please upload your resume to run the analysis.",
			});
			setStep(1);
			return;
		}

		// Cancel any previous in-flight request
		if (analyzeAbortRef.current) {
			analyzeAbortRef.current.abort();
		}

		// Reset timeout flag and create new abort controller
		analyzeTimedOutRef.current = false;
		const abortController = new AbortController();
		analyzeAbortRef.current = abortController;

		setIsAnalyzing(true);
		setExportResult(null);
		setGeneratedLatex(null);

		// Set up 60-second timeout
		const TIMEOUT_MS = 60000;
		const timeoutId = setTimeout(() => {
			analyzeTimedOutRef.current = true;
			abortController.abort();
			setIsAnalyzing(false);
			toast.error("Request timed out", {
				description: "Something went wrong. Please try again later.",
			});
		}, TIMEOUT_MS);

		try {
			// Commit temp resume to final storage before generation
			// This is the key step in soft-commit flow
			let finalObjectPath = uploadedResume?.objectPath;
			if (
				uploadedResume &&
				uploadState === "uploaded_temp" &&
				sessionId &&
				!isSessionLocked
			) {
				try {
					const commitResult = await commitResume();
					// Check if timed out while committing
					if (analyzeTimedOutRef.current) return;

					// Update local state with final path
					setUploadedResume({
						...uploadedResume,
						objectPath: commitResult.finalPath,
					});
					setUploadState("uploaded_final");
					finalObjectPath = commitResult.finalPath;

					toast.success("Resume confirmed", {
						description: "Starting generation...",
					});
				} catch (err) {
					// Ignore if timed out
					if (analyzeTimedOutRef.current) return;

					console.error("Failed to commit resume:", err);
					clearTimeout(timeoutId);
					toast.error("Couldn't confirm resume", {
						description: "Please try again.",
					});
					setIsAnalyzing(false);
					return;
				}
			}

			// Call /api/generate to create job and start LaTeX generation
			// Convert UI mode to API mode format
			const modeMap: Record<string, "quick" | "deep" | "scratch"> = {
				QUICK: "quick",
				DEEP: "deep",
				FROM_SCRATCH: "scratch",
			};
			const apiMode = modeMap[mode] || "quick";

			const res = await fetch("/api/generate", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					jdText: jobDescription,
					resumeObjectPath:
						finalObjectPath || uploadedResume?.objectPath,
					focusPrompt: focusPrompt || null,
					mode: apiMode,
					purpose: "preview", // Indicates this is for preview, not export
				}),
				signal: abortController.signal,
			});

			// Clear timeout since fetch completed
			clearTimeout(timeoutId);

			// Ignore response if timed out
			if (analyzeTimedOutRef.current) return;

			if (!res.ok) {
				const errorData = await res.json().catch(() => ({}));

				// Handle insufficient credits
				if (res.status === 402 || errorData.code === "NO_CREDITS") {
					toast.error("No credits remaining", {
						description:
							"You've used all your credits. Upgrade to generate more resumes.",
					});
					setIsAnalyzing(false);
					return;
				}

				throw new Error(errorData.error || "Generation failed");
			}

			const { jobId } = await res.json();

			// Final check before updating state
			if (analyzeTimedOutRef.current) return;

			setGenerationJobId(jobId);

			// Subscribe to Realtime updates for this job
			// The hook will handle setting step=2 and generatedLatex on success
			subscribeToJob(jobId);
		} catch (e) {
			// Ignore abort errors from timeout (already handled)
			if (e instanceof Error && e.name === "AbortError") {
				return;
			}

			// Ignore if timed out
			if (analyzeTimedOutRef.current) return;

			clearTimeout(timeoutId);
			console.error(e);
			setIsAnalyzing(false);
			toast.error("Generation failed", {
				description: "Something went wrong. Please try again later.",
			});
		}
		// Note: setIsAnalyzing(false) is handled by Realtime callbacks
	}, [
		mode,
		jobDescription,
		resumeFile,
		focusPrompt,
		uploadedResume,
		uploadState,
		sessionId,
		isSessionLocked,
		subscribeToJob,
	]);

	// Use real auth state from useAuth hook
	const { isAuthenticated } = useAuth();

	// Realtime subscription for export job (separate from preview job)
	const { subscribe: subscribeToExportJob, status: exportJobStatus } =
		useJobRealtime({
			onProcessing: () => {},
			onSuccess: async (latex) => {
				setIsExporting(false);
				setExportResult({ pdfUrl: "", latex }); // PDF URL will be set by job

				// Clear localStorage draft since session is now claimed
				clearDraft();

				// Reset all form state for fresh start
				setJobDescription("");
				setResumeFile(null);
				setUploadedResume(null);
				setFocusPrompt("");
				setAnalysis(null);
				setGeneratedLatex(null);
				setUploadState("idle");
				setUploadProgress(0);
				setUploadedBytes(0);
				setTotalBytes(0);
				setEstimatedSecondsRemaining(undefined);
				setUploadError(null);
				setHasPreviousDraft(false);
				setPreviousResumeFilename(null);
				setStep(0); // Go back to mode selection

				// Auto-start new session for clean UX
				try {
					const newId = await startNewSession();
					setSessionId(newId);
					setIsSessionLocked(false);
				} catch (err) {
					console.error("Failed to auto-start new session:", err);
				}

				// Show success toast
				toast.success("PDF generated successfully!", {
					description: "Your resume has been downloaded.",
				});

				setShowSuccessModal(true);
			},
			onError: (msg) => {
				console.error("[Export Realtime] Job failed:", msg);
				setIsExporting(false);
				toast.error("Generation failed", {
					description: msg || "Please try again.",
				});
			},
		});

	const exportPdf = useCallback(async () => {
		// Require generatedLatex (must have completed preview first)
		if (!generatedLatex || !generationJobId) {
			toast.warning("Please run preview first", {
				description: "Generate a resume preview before downloading.",
			});
			return;
		}

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
					setIsSessionLocked(true);
				} catch (err) {
					console.warn("Session claim skipped:", err);
				}
			}

			// Call export-pdf endpoint (compiles LaTeX → PDF, uploads to storage)
			const res = await fetch("/api/export-pdf", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ jobId: generationJobId }),
			});

			if (!res.ok) {
				const errorData = await res.json().catch(() => ({}));

				if (res.status === 409) {
					toast.error("LaTeX not ready", {
						description: "Please run preview first.",
					});
				} else if (res.status === 400) {
					toast.error("PDF compilation failed", {
						description:
							errorData.details ||
							"LaTeX may have syntax errors. Try copying and compiling manually.",
					});
				} else {
					toast.error("Export failed", {
						description: errorData.error || "Please try again.",
					});
				}
				setIsExporting(false);
				return;
			}

			const { pdfUrl } = await res.json();

			// Open PDF in new tab
			window.open(pdfUrl, "_blank", "noopener,noreferrer");

			// Clear localStorage draft since export is complete
			clearDraft();

			// Reset all form state for fresh start
			setJobDescription("");
			setResumeFile(null);
			setUploadedResume(null);
			setFocusPrompt("");
			setAnalysis(null);
			setGeneratedLatex(null);
			setGenerationJobId(null);
			setUploadState("idle");
			setUploadProgress(0);
			setUploadedBytes(0);
			setTotalBytes(0);
			setEstimatedSecondsRemaining(undefined);
			setUploadError(null);
			setHasPreviousDraft(false);
			setPreviousResumeFilename(null);
			setStep(0); // Go back to mode selection

			// Auto-start new session for clean UX
			try {
				const newId = await startNewSession();
				setSessionId(newId);
				setIsSessionLocked(false);
			} catch (err) {
				console.error("Failed to auto-start new session:", err);
			}

			toast.success("PDF ready!", {
				description: "Your resume has been opened in a new tab.",
			});

			setIsExporting(false);
			setShowSuccessModal(true);
		} catch (e) {
			console.error(e);
			setIsExporting(false);
			toast.error("Export failed", {
				description: "Please try again.",
			});
		}
	}, [
		generatedLatex,
		generationJobId,
		isAuthenticated,
		sessionId,
		isSessionLocked,
	]);

	const resetAll = useCallback(() => {
		setMode("QUICK");
		startFreshSession();
	}, [startFreshSession]);

	const handleCreateAnother = useCallback(() => {
		setShowSuccessModal(false);
		resetAll();
	}, [resetAll]);

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

		// LaTeX generation state (from Claude)
		generatedLatex,
		generationJobId,

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

		// Upload progress state (soft-commit flow)
		uploadState,
		uploadProgress,
		uploadedBytes,
		totalBytes,
		estimatedSecondsRemaining,
		uploadError,

		// Computed values
		canContinueFromStep0,
		canAnalyze,

		// Actions
		runAnalyze,
		exportPdf,
		resetAll,
		startFreshSession,
		clearUploadedResume,
		cancelUpload,
		retryUpload,

		// Success Modal
		showSuccessModal,
		setShowSuccessModal,
		handleCreateAnother,
	};
}
