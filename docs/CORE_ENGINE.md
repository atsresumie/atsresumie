## Task

- Integrate the core engine using Claude LLM to generate the Latex for Resume
- Convert the Latex to PDF and save it on the user database storage, and return the PDF URL to the user. Decuct the credits from the user's account and start a new session
- Effecient Prompt Engineering to generate the Latex for Resume assuring the quality of the resume

- After fininshing this task, we will focus on the Dashboard page.

---

## Resume Upload Soft-Commit System (2026-01-24)

### Overview

Implemented a soft-commit resume upload system to improve UX. Files are uploaded to temp storage immediately with progress tracking, then committed to final storage only when the user clicks "Preview & Analyze".

### Why Soft-Commit?

1. **Early failure detection** - Users know immediately if upload fails
2. **Progress feedback** - Real-time progress bar with percentage and ETA
3. **No orphan files** - Uncommitted temp files can be cleaned up
4. **File replacement** - Users can replace files before committing without leaving orphans

### User Flow

```
1. User selects file
   └─> Upload to temp/ with progress bar
   └─> Badge: "Uploaded (not confirmed)" (yellow)

2. User clicks "Preview & Analyze"
   └─> Commit: copy temp/ → final/, delete temp/
   └─> Badge: "Uploaded" (green)
   └─> Analysis runs using final path

3. If user replaces file before commit:
   └─> Delete old temp file
   └─> Upload new file to temp/
```

### Storage Structure

```
user-resumes/
├── sessions/
│   └── {sessionId}/
│       ├── temp/           # Uploaded but not confirmed
│       │   └── {timestamp}-{uuid}-{filename}
│       └── final/          # Confirmed and committed
│           └── {timestamp}-{uuid}-{filename}
```

### Database Changes

Added columns to `onboarding_drafts` table:

```sql
ALTER TABLE onboarding_drafts
ADD COLUMN resume_status TEXT CHECK (resume_status IN ('temp', 'final'));

ALTER TABLE onboarding_drafts
ADD COLUMN resume_uploaded_at TIMESTAMPTZ;

ALTER TABLE onboarding_drafts
ADD COLUMN resume_committed_at TIMESTAMPTZ;
```

Migration file: `supabase/migrations/001_add_resume_status.sql`

### API Endpoints

#### POST `/api/onboarding/commit-resume` (NEW)

Commits a temp resume to final storage.

**Flow:**

1. Reads temp path from draft
2. Copies file from `temp/` to `final/`
3. Deletes temp file
4. Updates draft with final path and `resume_status="final"`

**Response:**

```json
{
	"bucket": "user-resumes",
	"finalPath": "sessions/{id}/final/{timestamp}-{uuid}-{filename}",
	"originalFilename": "resume.pdf"
}
```

#### POST `/api/onboarding/resume-upload-url` (MODIFIED)

Now generates temp paths instead of final paths:

- Old: `sessions/{sessionId}/{timestamp}-{filename}`
- New: `sessions/{sessionId}/temp/{timestamp}-{uuid}-{filename}`

#### POST `/api/onboarding/save-draft` (MODIFIED)

- Changed from INSERT to UPSERT (update existing or insert new)
- Added `resumeStatus` field ("temp" | "final")
- Sets `resume_uploaded_at` timestamp

#### DELETE `/api/onboarding/delete-resume` (MODIFIED)

- Now clears all resume fields instead of deleting the draft
- Preserves JD text while removing resume data
- Clears `resume_status`, `resume_uploaded_at`, `resume_committed_at`

### Client Library Changes

#### `lib/onboarding/client.ts`

**New interface:**

```typescript
export interface UploadProgress {
	loaded: number;
	total: number;
	percentage: number;
	estimatedSecondsRemaining?: number;
}
```

**`uploadResume()` rewritten:**

- Uses XMLHttpRequest instead of Supabase SDK for progress events
- Supports `AbortSignal` for cancellation
- Calculates ETA based on upload speed

```typescript
export async function uploadResume(
	file: File,
	options?: {
		onProgress?: (progress: UploadProgress) => void;
		signal?: AbortSignal;
	},
): Promise<ResumeUploadResult>;
```

**New `commitResume()` function:**

```typescript
export async function commitResume(): Promise<CommitResumeResult>;
```

### Hook Changes

#### `useResumeForm.ts`

**New state:**

```typescript
uploadState: "idle" | "preparing" | "uploading" | "uploaded_temp" | "uploaded_final" | "error"
uploadProgress: number      // 0-100
uploadedBytes: number       // bytes uploaded
totalBytes: number          // total file size
estimatedSecondsRemaining?: number
uploadError?: string
```

**New functions:**

- `cancelUpload()` - Aborts in-progress upload
- `retryUpload()` - Retries failed upload with same file

**Enhanced `handleResumeFileChange()`:**

1. Cancels any in-progress upload
2. Deletes previous temp file if replacing
3. Uploads with progress tracking via XHR
4. Saves draft with `resume_status="temp"`

**Enhanced `runAnalyze()`:**

1. Commits temp resume to final before analysis
2. Updates `uploadState` to `uploaded_final`
3. Uses final path for analysis

### UI Components

#### `FilePreview.tsx` (Rewritten)

Supports all upload states:

| State            | Icon         | Display                                                 |
| ---------------- | ------------ | ------------------------------------------------------- |
| `preparing`      | Spinner      | "Preparing upload…"                                     |
| `uploading`      | Blue spinner | Progress bar + "45% • 1.2 MB / 2.5 MB • ~12s remaining" |
| `uploaded_temp`  | Yellow check | File size + yellow "Not confirmed" badge                |
| `uploaded_final` | Green check  | File size + green "Uploaded" badge                      |
| `error`          | Red X        | Error message + Retry button                            |

**Features:**

- Animated gradient progress bar during upload
- Cancel button during upload
- Retry button on error
- Proper remove button for each state

#### `Step1InputForm.tsx` (Modified)

Added props for upload progress state:

- `uploadState`, `uploadProgress`, `uploadedBytes`, `totalBytes`
- `estimatedSecondsRemaining`, `uploadError`
- `onCancelUpload`, `onRetryUpload`

#### `page.tsx` (Modified)

Passes all upload progress props from hook to form component.

### Files Changed

| File                                                      | Type      |
| --------------------------------------------------------- | --------- |
| `supabase/migrations/001_add_resume_status.sql`           | NEW       |
| `app/api/onboarding/commit-resume/route.ts`               | NEW       |
| `app/api/onboarding/resume-upload-url/route.ts`           | MODIFIED  |
| `app/api/onboarding/save-draft/route.ts`                  | MODIFIED  |
| `app/api/onboarding/delete-resume/route.ts`               | MODIFIED  |
| `lib/onboarding/client.ts`                                | MODIFIED  |
| `components/get-started/hooks/useResumeForm.ts`           | MODIFIED  |
| `components/get-started/steps/components/FilePreview.tsx` | REWRITTEN |
| `components/get-started/steps/Step1InputForm.tsx`         | MODIFIED  |
| `app/get-started/page.tsx`                                | MODIFIED  |

### Testing Checklist

- [ ] Upload small file (<100KB) - quick progress animation
- [ ] Upload larger file (2-5MB) - verify progress bar, percentage, ETA
- [ ] Cancel upload mid-way - verify cancellation works
- [ ] Upload file A, then upload file B before confirming - verify file A deleted
- [ ] Click "Preview & Analyze" - verify commit happens, badge turns green
- [ ] Remove file after commit - verify final file deleted
- [ ] Disconnect network during upload - verify retry button works

---

## PDF Download & Form Reset Improvements (2026-01-25)

### Problem

When user clicked "Download PDF", two issues occurred:

1. The PDF opened in the **same tab**, redirecting away from the app
2. When returning, the **form state was preserved** (old JD text, resume still showing) even though a new session was started

### Solution

#### 1. PDF Opens in New Tab

Changed the auto-download behavior to open PDF in a new browser tab:

```typescript
// Before (redirected current page)
const link = document.createElement("a");
link.href = job.pdfUrl;
link.download = "resume.pdf";
link.click();

// After (opens in new tab)
window.open(job.pdfUrl, "_blank", "noopener,noreferrer");
```

#### 2. Complete Form State Reset After Export

After successful PDF generation, all form state is now reset:

```typescript
// Clear localStorage draft
clearDraft();

// Reset all form state for fresh start
setJobDescription("");
setResumeFile(null);
setUploadedResume(null);
setFocusPrompt("");
setAnalysis(null);
setUploadState("idle");
setUploadProgress(0);
setUploadedBytes(0);
setTotalBytes(0);
setEstimatedSecondsRemaining(undefined);
setUploadError(null);
setHasPreviousDraft(false);
setPreviousResumeFilename(null);
setStep(0); // Go back to mode selection

// Start new session
const newId = await startNewSession();
setSessionId(newId);
```

### Expected Behavior After Export

| Item               | Before              | After            |
| ------------------ | ------------------- | ---------------- |
| PDF                | Opens in same tab   | Opens in new tab |
| localStorage draft | Sometimes persisted | Always cleared   |
| Job Description    | Old value shown     | Empty            |
| Resume file        | Old file shown      | Cleared          |
| Focus prompt       | Old value shown     | Empty            |
| Step               | Stayed on step 2    | Reset to step 0  |
| Session cookie     | New session         | New session      |

### Files Modified

| File                                            | Change                                         |
| ----------------------------------------------- | ---------------------------------------------- |
| `components/get-started/hooks/useResumeForm.ts` | Added form state reset after successful export |
