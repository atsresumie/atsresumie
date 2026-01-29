# Authentication Implementation

## Supabase Auth with Email/Password and Google OAuth

### Files Created

| File                            | Purpose                                                                                     |
| ------------------------------- | ------------------------------------------------------------------------------------------- |
| `lib/auth/auth.ts`              | Auth helper functions (`signUpWithEmail`, `signInWithEmail`, `signInWithGoogle`, `signOut`) |
| `lib/auth/AuthContext.tsx`      | React context with `onAuthStateChange` listener                                             |
| `hooks/useAuth.ts`              | Hook for consuming auth context                                                             |
| `middleware.ts`                 | Session refresh on each request                                                             |
| `app/auth/callback/route.ts`    | PKCE code exchange for OAuth                                                                |
| `components/auth/AuthModal.tsx` | Login/Signup modal with email + Google OAuth                                                |

### Files Modified

| File                                            | Change                                                                           |
| ----------------------------------------------- | -------------------------------------------------------------------------------- |
| `app/providers.tsx`                             | Wrapped with `AuthProvider`                                                      |
| `components/get-started/SignupGateModal.tsx`    | Integrated `AuthModal`, changed prop `onContinue` → `onAuthSuccess`              |
| `components/landing/Navbar.tsx`                 | Added Sign In/Sign Up buttons, user menu when authenticated                      |
| `app/get-started/page.tsx`                      | Updated to use `onAuthSuccess` prop                                              |
| `components/get-started/hooks/useResumeForm.ts` | Replaced `isLoggedIn = false` stub with `useAuth()`, added `claimSession()` call |

---

## Fixes

### 2026-01-20: Analyze Button Disabled Fix

**Problem:** Analyze button disabled when session restored with previous resume filename.

**Cause:** `canAnalyze` required `resumeFile !== null`, but restored sessions only have `uploadedResume` (server reference).

**Fix in `useResumeForm.ts`:**

```typescript
// Before
const canAnalyze = resumeFile !== null && ...

// After
const hasResumeForAnalysis = resumeFile !== null || uploadedResume !== null;
const canAnalyze = hasResumeForAnalysis && ...
```

Added clearer toast when user needs to re-upload for analysis.

---

### 2026-01-20: Stored Resume Analysis (No Re-upload Needed)

**Problem:** Users had to re-upload resume even when it was already saved on server.

**Fix:**

- Updated `/api/analyze` to accept `resumeBucket` + `resumeObjectPath` params
- API now fetches stored resume from Supabase Storage
- Updated `runAnalyze()` to send storage reference for restored sessions

Users can now analyze with their previously uploaded resume without re-uploading.

---

### 2026-01-20: Claim Session RPC Function

**Added SQL to Supabase:**

```sql
ALTER TABLE onboarding_sessions ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION public.claim_onboarding_session(p_session_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE onboarding_sessions
  SET user_id = auth.uid(), status = 'claimed', claimed_at = NOW()
  WHERE id = p_session_id AND status = 'active' AND user_id IS NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'Session invalid'; END IF;
END;
$$;
```

---

### 2026-01-20: TopNav User Menu

**Updated `components/get-started/TopNav.tsx`:**

- Added user icon button (top right) when authenticated
- Dropdown shows email and "Sign out" option
- Closes on click outside
- Fixed z-index overlay issue (changed to `z-20`)

---

### 2026-01-20: Claimed Session Draft Error Fix

**Problem:** "Session is no longer active" error when running analysis after logging in.

**Cause:** After user authenticates and claims session, trying to save draft to claimed session fails.

**Fix in `useResumeForm.ts`:**

```typescript
// Skip draft saving if session is claimed
if (uploadedResume && sessionId && !isSessionLocked) {
	// Save draft...
}
```

---

## Setup Required

### Google Cloud Console

- Authorized redirect URI: `https://fmrowpqnrvtyfwxrrqfg.supabase.co/auth/v1/callback`

### Supabase Dashboard

1. **Authentication → Providers → Google**: Enable + add Client ID/Secret
2. **Authentication → URL Configuration**:
    - Site URL: `http://localhost:3000`
    - Redirect URL: `http://localhost:3000/auth/callback`

---

### 2026-01-21: Credits System

**New Files:**

- `hooks/useCredits.ts` - Fetch and cache credits
- `app/api/credits/route.ts` - GET endpoint
- `supabase/credits_system.sql` - DB schema

**Modified Files:**

- `TopNav.tsx` - Credits badge (colored by balance)
- `app/api/export/route.ts` - Auth + credits check + decrement
- `useResumeForm.ts` - NO_CREDITS error handling

**UI Copy:**

- Normal: "Credits: 3"
- Low: "⚠ Credits: 1" (yellow)
- Zero: "Credits: 0" (red)

---

### 2026-01-21: Generation Job System

**Purpose:** Job-based lifecycle (pending → running → succeeded) with polling.

**New Files:**

- `supabase/generation_jobs.sql` - Table schema + RPCs
- `app/api/generate/route.ts` - Create job + mock processing
- `hooks/useJobPolling.ts` - Polling logic
- `SuccessModal.tsx` - Post-generation UI

**Modified Files:**

- `useResumeForm.ts` - Integrated polling & success modal

**Flow:**

1. Click Generate → POST /api/generate
2. Poll /api/jobs/[id]
3. On Success: decrement credit, show modal
4. Modal: "Create Another" (resets session) or "Dashboard"

---

### 2026-01-22: Auto-Renew Expired Sessions

**Problem**: Authenticated users with expired/locked sessions saw warning toast and had to manually click Reset.

**Solution**:

- Auto-start new session for authenticated users with locked sessions
- Skip warning toast, show "Started fresh session" instead
- Non-authenticated users still see manual warning

**Modified**: `useResumeForm.ts` session init flow

---

### 2026-01-22: Clear Claimed Session Data

**Problem**: After successful PDF generation, old session data (job description + resume) was repopulating the form on next visit.

**Solution**:

- Call `clearDraft()` after successful generation to remove localStorage data
- **Auto-start new session immediately after export** (no waiting for navigation)
- Only restore draft if `status.isEditable === true` (not claimed)
- Claimed sessions no longer populate form fields

**Modified**: `useResumeForm.ts` - `pollJobStatus` and session init

**UX Flow**:

1. User generates PDF → job succeeds
2. localStorage cleared + new session started automatically
3. Success modal shows with fresh session ready
4. Click "Create Another" → clean form, no old data

---

### 2026-01-22: Auto-Download PDF on Success

**Feature**: Automatic PDF download when generation completes successfully.

**Implementation**:

- Programmatically trigger download via `<a>` element with `download` attribute
- Success toast: "PDF generated successfully! Your resume is downloading now."
- Download happens before success modal appears

**Modified**: `useResumeForm.ts` - `pollJobStatus`

---

### 2026-01-29: Auth Gate for Preview & Analyze

**Feature**: Gate the "Preview & Analyze" action behind authentication. Unauthenticated users now must sign in before generating a resume preview.

**Changes**:

- **`useResumeForm.ts`**:
    - Added auth check at the start of `runAnalyze` function
    - Shows toast warning: "Sign in required - Please sign in to preview and generate your resume."
    - Opens `SignupGateModal` when unauthenticated

- **`SignupGateModal.tsx`**:
    - Updated modal title from "Create an account to download" → "Create an account to continue"
    - Updated description to be more generic (works for both preview and export)

**User Flow**:

1. Unauthenticated user fills JD + uploads resume
2. Clicks "Preview & Analyze"
3. Toast appears: "Sign in required"
4. Signup modal opens
5. After successful auth, user can run analysis

---

## Next Task

- Claude API integration (real generation)
- LaTeX compiler implementation
