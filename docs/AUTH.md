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

## Next Task

- Claude API integration (real generation)
- LaTeX compiler implementation
- Polish onboarding workflow
- Local storage on_boarding session change on reset as well.
  Fix the issue of session expired, create a new one for uploading. User should not think about that,
  They just want to create it, make it smooth.
