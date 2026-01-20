# ATSResumie - Implementation History

This document tracks major features and changes made to the application.

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

### Session Cookie Strategy
- Cookie is httpOnly, sameSite: lax, secure in production
- 7-day expiration
- Contains only session UUID, not user data

### Dual Storage
- Server: Supabase tables for persistence
- Client: localStorage as backup (via `lib/storage/draft.ts`)

---

*Last updated: 2026-01-19*
