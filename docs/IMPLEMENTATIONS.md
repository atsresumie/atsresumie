# ATSResumie - Implementation History

This document tracks major features and changes made to the application.

---

## 2026-01-20

### Get Started Button UI Fix

**Purpose:** Make the entire "Get Started" button clickable, not just the text.

**Changes:**

- Modified `components/landing/Hero.tsx`
    - Restructured button component to wrap `<Link>` around `<motion.button>` instead of nesting Link inside button
    - Removed conflicting `onClick` handler
    - Added `className="w-full sm:w-auto"` to Link wrapper for proper responsive sizing

---

### Supabase Authentication (feat/authentication)

**Purpose:** Implement full authentication system with email/password and Google OAuth.

**New Files Created:**
| File | Purpose |
|------|---------|
| `lib/auth/auth.ts` | Auth helper functions (signUp, signIn, signInWithGoogle, signOut) |
| `lib/auth/AuthContext.tsx` | React context with `onAuthStateChange` listener |
| `hooks/useAuth.ts` | Custom hook to consume auth state |
| `middleware.ts` | Session refresh on each request |
| `app/auth/callback/route.ts` | PKCE code exchange for OAuth |
| `components/auth/AuthModal.tsx` | Login/Signup modal with email + Google |
| `app/dashboard/page.tsx` | Placeholder dashboard page |

**Modified Files:**

- `app/providers.tsx` - Wrapped with `AuthProvider`
- `components/landing/Navbar.tsx` - Added Sign In/Sign Up buttons, user menu
- `components/get-started/TopNav.tsx` - Added user menu icon and Dashboard button
- `components/get-started/SignupGateModal.tsx` - Integrated `AuthModal`
- `components/get-started/hooks/useResumeForm.ts` - Replaced auth stub with real `useAuth()`
- `app/api/analyze/route.ts` - Support fetching stored resume from Supabase Storage

**Database Changes (Supabase SQL):**

```sql
ALTER TABLE onboarding_sessions ADD COLUMN claimed_at TIMESTAMPTZ;

CREATE FUNCTION claim_onboarding_session(p_session_id UUID)
-- Links anonymous session to authenticated user
```

**Key Features:**

- Email/Password signup and signin
- Google OAuth integration
- Session refresh via middleware
- Auth-gated PDF export
- Session claiming (links anonymous work to user)
- TopNav user menu with sign out
- Dashboard navigation button

---

### Dashboard Navigation

**Purpose:** Add dashboard page and navigation button for authenticated users.

**New Files:**

- `app/dashboard/page.tsx` - Placeholder dashboard page with coming soon features list

**Modified Files:**

- `components/get-started/TopNav.tsx` - Added "Dashboard" button (only visible when authenticated)

---

### Credits System

**Purpose:** Implement credits system where users get 3 credits on signup, decremented on successful PDF generation.

**Design:** Balance + Extensible RPC approach for future Stripe integration.

**New Files:**

- `hooks/useCredits.ts` - Hook to fetch and cache user credits
- `app/api/credits/route.ts` - GET endpoint to retrieve credits
- `supabase/credits_system.sql` - Database schema, RLS, triggers, RPCs

**Modified Files:**

- `components/get-started/TopNav.tsx` - Credits badge display
- `app/api/export/route.ts` - Auth check + credits verification + decrement on success
- `components/get-started/hooks/useResumeForm.ts` - NO_CREDITS error handling

**Database (Supabase):**

- `user_profiles` table with `credits` column
- `handle_new_user()` trigger grants 3 credits on signup
- `get_credits()` RPC returns current balance
- `adjust_credits(delta, reason, source)` RPC for atomic mutations

**Future Stripe:** Call `adjust_credits(+N, 'purchase', 'stripe')`

---

## 2026-01-19

### Session Restoration & Draft Protection

**Purpose:** Restore user's previous work when they return to `/get-started` with an existing session.

**Changes:**

- Created `/api/onboarding/session-status` endpoint
    - Returns session status (`active`, `claimed`, `expired`)
    - Returns existing draft data (JD text, resume filename)
    - Returns `isEditable` flag to determine if session is locked

- Updated `/api/onboarding/start` route
    - Added `forceNew` parameter to clear old session and create fresh one

- Added client helpers in `lib/onboarding/client.ts`
    - `getSessionStatus()` - Fetch session and draft data
    - `startNewSession()` - Force create a new session

- Updated `useResumeForm` hook
    - Now fetches session status on mount instead of just starting session
    - Restores JD text from server if draft exists
    - Added states: `isLoadingSession`, `isSessionLocked`, `hasPreviousDraft`, `previousResumeFilename`
    - Added `startFreshSession()` function to clear and restart

---

### Resume File UI Restoration

**Purpose:** Show previously uploaded resume filename in the UI when session is restored.

**Changes:**

- Modified `components/get-started/steps/components/FilePreview.tsx`
    - Now accepts optional `filename` string and `isRestored` boolean props
    - Shows green checkmark icon for restored files
    - Displays "Previously uploaded" instead of file size
- Updated `components/get-started/steps/Step1InputForm.tsx`
    - Added `previousResumeFilename` prop
    - Shows FilePreview with restored filename when session has previous resume
    - Clicking X on restored file opens file picker instead of clearing

- Updated `app/get-started/page.tsx`
    - Passes `previousResumeFilename` from hook to Step1InputForm

---

### Resume File Deletion

**Purpose:** Allow users to delete their uploaded resume and upload a new one.

**Changes:**

- Created `/api/onboarding/delete-resume` endpoint
    - DELETE method to remove file from Supabase Storage
    - Also deletes associated draft record
    - Validates session is active before allowing deletion

- Added `deleteResume()` in `lib/onboarding/client.ts`
    - Client helper to call the delete API

- Updated `useResumeForm` hook
    - Added `isDeletingResume` state
    - Added `clearUploadedResume()` function that deletes from server and clears local state

- Updated `FilePreview` component
    - Added `isDeleting` prop
    - Shows spinner and "Removing..." text during deletion
    - Disables remove button while deleting

- Updated `Step1InputForm` and page
    - Added `onClearResume` and `isDeletingResume` props
    - Clicking X now deletes from server, then allows new upload

---

### Deno Module Import Fix

**Purpose:** Fix TypeScript error with Deno standard library import.

**Changes:**

- Updated `supabase/functions/process-generation-job/index.ts`
    - Changed from `import { serve }` to built-in `Deno.serve()`
- Updated `supabase/functions/deno.json`
    - Upgraded std library version from `0.168.0` to `0.224.0`
- Updated `tsconfig.json`
    - Excluded `supabase/functions` from Next.js TypeScript compilation

---

## Architecture Decisions

### Anonymous Onboarding Flow

Users can start using the app without signing up. Session is tracked via `ats_onboarding_session` httpOnly cookie. Data is persisted to Supabase and restored on return.

### Authentication Strategy

- Supabase Auth for user management
- Email/Password + Google OAuth
- Middleware refreshes session on every request
- AuthContext provides reactive state via `useAuth()` hook

### Session Cookie Strategy

- Cookie is httpOnly, sameSite: lax, secure in production
- 14-day expiration
- Contains only session UUID, not user data

### Dual Storage

- Server: Supabase tables for persistence
- Client: localStorage as backup (via `lib/storage/draft.ts`)

---

_Last updated: 2026-01-21_
