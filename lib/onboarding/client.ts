import { supabaseBrowser } from "@/lib/supabase/browser";

/**
 * Client-side helpers for the onboarding flow.
 * These functions should be called from React components (client-side).
 */

export interface ResumeUploadResult {
  bucket: string;
  objectPath: string;
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
}

export type JobStatus = "queued" | "running" | "succeeded" | "failed" | "canceled";

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

/**
 * Upload a resume file to Supabase Storage.
 * 
 * Steps:
 * 1. Get signed upload URL from server
 * 2. Upload file directly to signed URL using Supabase client
 * 
 * @param file - The resume file (PDF or DOCX)
 * @returns { bucket, objectPath }
 */
export async function uploadResume(file: File): Promise<ResumeUploadResult> {
  // Validate file type on client side as well
  const allowedTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Invalid file type. Only PDF and DOCX files are allowed.");
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
  });

  if (!urlResponse.ok) {
    const error = await urlResponse.json();
    throw new Error(error.error || "Failed to get upload URL");
  }

  const { bucket, objectPath, token } = await urlResponse.json();

  // Upload file using Supabase client
  const supabase = supabaseBrowser();
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .uploadToSignedUrl(objectPath, token, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error("Upload error:", uploadError);
    throw new Error(uploadError.message || "Failed to upload file");
  }

  return { bucket, objectPath };
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
  } = {}
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
    if (status.status === "succeeded" || status.status === "failed" || status.status === "canceled") {
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
