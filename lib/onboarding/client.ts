// Client-side onboarding helpers

/**
 * Client-side helpers for the onboarding flow.
 * These functions should be called from React components (client-side).
 */

export interface ResumeUploadResult {
	bucket: string;
	objectPath: string;
	originalFilename: string;
}

export interface UploadProgress {
	loaded: number;
	total: number;
	percentage: number;
	estimatedSecondsRemaining?: number;
}

export interface SaveDraftData {
	jdText: string;
	jdSourceUrl?: string;
	jdTitle?: string;
	jdCompany?: string;
	resumeBucket: string;
	resumeObjectPath: string;
	resumeOriginalFilename?: string;
	resumeMimeType?: string;
	resumeSizeBytes?: number;
	resumeExtractedText?: string;
	resumeStatus?: "temp" | "final"; // For soft-commit flow
}

export type JobStatus =
	| "queued"
	| "running"
	| "succeeded"
	| "failed"
	| "canceled";

export interface JobStatusResult {
	id: string;
	status: JobStatus;
	progress: number;
	errorMessage: string | null;
	updatedAt: string;
}

/**
 * Start or resume an onboarding session.
 * Sets httpOnly cookie on server side.
 * @returns sessionId
 */
export async function startOnboardingSession(): Promise<string> {
	const response = await fetch("/api/onboarding/start", {
		method: "POST",
		credentials: "include",
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || "Failed to start session");
	}

	const data = await response.json();
	return data.sessionId;
}

export interface SessionStatusResult {
	sessionId: string;
	status: "active" | "claimed" | "expired";
	isEditable: boolean;
	draft: {
		jdText: string;
		jdTitle: string | null;
		jdCompany: string | null;
		resumeOriginalFilename: string | null;
		resumeBucket: string | null;
		resumeObjectPath: string | null;
	} | null;
}

/**
 * Get the current session status and any existing draft data.
 * Returns null if no session exists.
 */
export async function getSessionStatus(): Promise<SessionStatusResult | null> {
	const response = await fetch("/api/onboarding/session-status", {
		method: "GET",
		credentials: "include",
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || "Failed to get session status");
	}

	const data = await response.json();

	// If no session found, return null
	if (data.hasSession === false || data.error === "No session found") {
		return null;
	}

	return data as SessionStatusResult;
}

/**
 * Start a completely new session, clearing any existing one.
 * @returns new sessionId
 */
export async function startNewSession(): Promise<string> {
	const response = await fetch("/api/onboarding/start", {
		method: "POST",
		credentials: "include",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ forceNew: true }),
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || "Failed to start new session");
	}

	const data = await response.json();
	return data.sessionId;
}

/**
 * Delete a resume file from Supabase Storage.
 * Also removes the associated draft record.
 *
 * @param bucket - Storage bucket name
 * @param objectPath - Path to the file in storage
 */
export async function deleteResume(
	bucket: string,
	objectPath: string,
): Promise<void> {
	const response = await fetch("/api/onboarding/delete-resume", {
		method: "DELETE",
		credentials: "include",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ bucket, objectPath }),
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || "Failed to delete resume");
	}
}

/**
 * Upload a resume file to Supabase Storage with progress tracking.
 *
 * Steps:
 * 1. Get signed upload URL from server
 * 2. Upload file using XHR for progress events
 *
 * @param file - The resume file (PDF or DOCX)
 * @param options - Optional callbacks and abort signal
 * @returns { bucket, objectPath, originalFilename }
 */
export async function uploadResume(
	file: File,
	options?: {
		onProgress?: (progress: UploadProgress) => void;
		signal?: AbortSignal;
	},
): Promise<ResumeUploadResult> {
	// Validate file type on client side as well
	const allowedTypes = [
		"application/pdf",
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	];

	if (!allowedTypes.includes(file.type)) {
		throw new Error(
			"Invalid file type. Only PDF and DOCX files are allowed.",
		);
	}

	// Check if already aborted
	if (options?.signal?.aborted) {
		throw new Error("Upload cancelled");
	}

	// Get signed upload URL
	const urlResponse = await fetch("/api/onboarding/resume-upload-url", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		credentials: "include",
		body: JSON.stringify({
			filename: file.name,
			mimeType: file.type,
			fileSize: file.size,
		}),
		signal: options?.signal,
	});

	if (!urlResponse.ok) {
		const error = await urlResponse.json();
		throw new Error(error.error || "Failed to get upload URL");
	}

	const { bucket, objectPath, signedUrl } = await urlResponse.json();

	// Upload file using XHR for progress tracking
	return new Promise<ResumeUploadResult>((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		const startTime = Date.now();

		// Handle abort signal
		if (options?.signal) {
			options.signal.addEventListener("abort", () => {
				xhr.abort();
				reject(new Error("Upload cancelled"));
			});
		}

		// Track progress
		xhr.upload.addEventListener("progress", (event) => {
			if (event.lengthComputable && options?.onProgress) {
				const percentage = Math.round(
					(event.loaded / event.total) * 100,
				);
				const elapsedSeconds = (Date.now() - startTime) / 1000;
				const bytesPerSecond = event.loaded / elapsedSeconds;
				const remainingBytes = event.total - event.loaded;
				const estimatedSecondsRemaining =
					bytesPerSecond > 0
						? Math.ceil(remainingBytes / bytesPerSecond)
						: undefined;

				options.onProgress({
					loaded: event.loaded,
					total: event.total,
					percentage,
					estimatedSecondsRemaining,
				});
			}
		});

		xhr.addEventListener("load", () => {
			if (xhr.status >= 200 && xhr.status < 300) {
				resolve({
					bucket,
					objectPath,
					originalFilename: file.name,
				});
			} else {
				reject(new Error(`Upload failed with status ${xhr.status}`));
			}
		});

		xhr.addEventListener("error", () => {
			reject(new Error("Upload failed - network error"));
		});

		xhr.addEventListener("abort", () => {
			reject(new Error("Upload cancelled"));
		});

		// Open and send
		xhr.open("PUT", signedUrl);
		xhr.setRequestHeader("Content-Type", file.type);
		xhr.send(file);
	});
}

export interface CommitResumeResult {
	bucket: string;
	finalPath: string;
	originalFilename: string;
	alreadyCommitted?: boolean;
}

/**
 * Commit a temp resume to final storage.
 * This should be called when user clicks "Preview & Analyze".
 *
 * @returns { bucket, finalPath, originalFilename }
 */
export async function commitResume(): Promise<CommitResumeResult> {
	const response = await fetch("/api/onboarding/commit-resume", {
		method: "POST",
		credentials: "include",
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || "Failed to commit resume");
	}

	return await response.json();
}

/**
 * Save an onboarding draft with JD and resume information.
 * @param data - Draft data including JD text and resume metadata
 * @returns draftId
 */
export async function saveDraft(data: SaveDraftData): Promise<string> {
	const response = await fetch("/api/onboarding/save-draft", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		credentials: "include",
		body: JSON.stringify(data),
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || "Failed to save draft");
	}

	const result = await response.json();
	return result.draftId;
}

/**
 * Claim the current onboarding session after signing up.
 * This links the anonymous session to the authenticated user and creates a generation job.
 * @returns jobId
 */
export async function claimSession(): Promise<string> {
	const response = await fetch("/api/onboarding/claim", {
		method: "POST",
		credentials: "include",
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || "Failed to claim session");
	}

	const result = await response.json();
	return result.jobId;
}

/**
 * Poll job status with exponential backoff.
 *
 * @param jobId - The generation job ID
 * @param options - Polling options
 * @returns Final job status when complete or failed
 */
export async function pollJobStatus(
	jobId: string,
	options: {
		maxAttempts?: number;
		initialDelayMs?: number;
		maxDelayMs?: number;
		onProgress?: (status: JobStatusResult) => void;
	} = {},
): Promise<JobStatusResult> {
	const {
		maxAttempts = 60,
		initialDelayMs = 1000,
		maxDelayMs = 10000,
		onProgress,
	} = options;

	let attempt = 0;
	let delayMs = initialDelayMs;

	while (attempt < maxAttempts) {
		const response = await fetch(`/api/jobs/${jobId}`, {
			method: "GET",
			credentials: "include",
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.error || "Failed to fetch job status");
		}

		const status: JobStatusResult = await response.json();

		// Notify progress callback
		if (onProgress) {
			onProgress(status);
		}

		// Check if job is complete
		if (
			status.status === "succeeded" ||
			status.status === "failed" ||
			status.status === "canceled"
		) {
			return status;
		}

		// Wait with exponential backoff
		await new Promise((resolve) => setTimeout(resolve, delayMs));
		delayMs = Math.min(delayMs * 1.5, maxDelayMs);
		attempt++;
	}

	throw new Error("Job polling timed out");
}

/**
 * Complete onboarding flow helper.
 *
 * Usage example:
 * ```typescript
 * // 1. Start session (do this early, e.g., on page load)
 * await startOnboardingSession();
 *
 * // 2. When user selects a file
 * const { bucket, objectPath } = await uploadResume(file);
 *
 * // 3. When user submits the form
 * const draftId = await saveDraft({
 *   jdText: jobDescription,
 *   jdTitle: "Software Engineer",
 *   jdCompany: "Acme Corp",
 *   resumeBucket: bucket,
 *   resumeObjectPath: objectPath,
 *   resumeOriginalFilename: file.name,
 *   resumeMimeType: file.type,
 *   resumeSizeBytes: file.size,
 * });
 *
 * // 4. After user signs up
 * const jobId = await claimSession();
 *
 * // 5. Poll for completion
 * const finalStatus = await pollJobStatus(jobId, {
 *   onProgress: (status) => console.log(`Progress: ${status.progress}%`)
 * });
 * ```
 */
