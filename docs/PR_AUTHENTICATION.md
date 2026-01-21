# 🔐 feat: Implement Supabase Authentication

## Description

Implements comprehensive authentication using Supabase Auth with support for email/password and Google OAuth sign-in.

---

## Changes

### New Files

| File                            | Description                                                   |
| ------------------------------- | ------------------------------------------------------------- |
| `lib/auth/auth.ts`              | Auth helper functions (signUp, signIn, signOut, Google OAuth) |
| `lib/auth/AuthContext.tsx`      | React context provider with `onAuthStateChange` listener      |
| `hooks/useAuth.ts`              | Custom hook for consuming auth state                          |
| `middleware.ts`                 | Session refresh on every request                              |
| `app/auth/callback/route.ts`    | PKCE code exchange for OAuth callbacks                        |
| `components/auth/AuthModal.tsx` | Sign In/Sign Up modal with email + Google                     |

### Modified Files

| File                                            | Change                                               |
| ----------------------------------------------- | ---------------------------------------------------- |
| `app/providers.tsx`                             | Wrapped app with `AuthProvider`                      |
| `components/landing/Navbar.tsx`                 | Added Sign In/Sign Up buttons, user menu             |
| `components/get-started/SignupGateModal.tsx`    | Integrated `AuthModal` for PDF export gate           |
| `components/get-started/hooks/useResumeForm.ts` | Replaced auth stub with real `useAuth()` state       |
| `app/api/analyze/route.ts`                      | Support fetching stored resume from Supabase Storage |

### Database (Supabase)

```sql
ALTER TABLE onboarding_sessions ADD COLUMN claimed_at TIMESTAMPTZ;

CREATE FUNCTION claim_onboarding_session(p_session_id UUID)
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

## Features

- ✅ Email/Password signup and signin
- ✅ Google OAuth integration
- ✅ Automatic session management via middleware
- ✅ Auth state available globally via `useAuth()` hook
- ✅ PDF export gated behind authentication
- ✅ Session claiming links anonymous work to user account
- ✅ Navbar shows user state dynamically
- ✅ Analyze button works with restored session (no re-upload needed)

---

## Testing

1. Run `pnpm dev`
2. Test email signup → verify toast appears
3. Test email signin → verify session persists
4. Test Google OAuth → verify redirect works
5. Test PDF export gate → verify auth modal appears
6. Test session restoration → verify Analyze button is enabled

---

## Setup Required

### Supabase Dashboard

1. **Authentication → Providers → Google**: Enable + add Client ID/Secret
2. **Authentication → URL Configuration**:
    - Site URL: `http://localhost:3000`
    - Redirect URLs: `http://localhost:3000/auth/callback`

### Google Cloud Console

- Authorized redirect URI: `https://<project>.supabase.co/auth/v1/callback`
