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

---

## Setup Required

### Google Cloud Console

- Authorized redirect URI: `https://fmrowpqnrvtyfwxrrqfg.supabase.co/auth/v1/callback`

### Supabase Dashboard

1. **Authentication → Providers → Google**: Enable + add Client ID/Secret
2. **Authentication → URL Configuration**:
    - Site URL: `http://localhost:3000`
    - Redirect URL: `http://localhost:3000/auth/callback`

## Next Task

- When user is already logged in, and the user will be on get-started page, on the navbar ,on top right corner, the user will see the user menu.

- Also, when the user signs up they will automatically have the credit on their account, after sign up they should see a message that they have the credit remaining which is 3 credits.

- Not on authentication part, but temporarily, we will integrate Claude API to generate Latex for the user. We will also use Latex compiler to generate PDF according to the Latex code.

- Fix: Authentication bugs and polish the entire on-boarding workflow in authentication branch.
