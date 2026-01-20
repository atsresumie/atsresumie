# ATSResumie - Application Workflow

This document tracks the complete user workflow and data flow of the application.

---

## Overview

ATSResumie is a resume tailoring application that helps users optimize their resumes for specific job descriptions using AI analysis.

---

## User Flow Diagram

```
┌─────────────────┐
│   Landing Page  │  /
│   (Marketing)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────────────────────────────┐
│  Get Started    │────▶│  Step 0: Mode Selection              │
│  /get-started   │     │  - QUICK (fast analysis)             │
└─────────────────┘     │  - DETAILED (thorough analysis)      │
                        └──────────────────┬───────────────────┘
                                           │
                                           ▼
                        ┌──────────────────────────────────────┐
                        │  Step 1: Input Form                  │
                        │  - Paste Job Description             │
                        │  - Upload Resume (PDF/DOCX)          │
                        │  - Optional focus prompt             │
                        └──────────────────┬───────────────────┘
                                           │ Click "Analyze"
                                           ▼
                        ┌──────────────────────────────────────┐
                        │  Step 2: Preview Results             │
                        │  - ATS Score                         │
                        │  - Suggested Changes                 │
                        │  - Download PDF (requires signup)    │
                        └──────────────────────────────────────┘
```

---

## Technical Workflow

### 1. Session Initialization

When user visits `/get-started`:

```
Client                          Server
  │                               │
  ├──GET /api/onboarding/session-status──▶│
  │                               │ Check cookie, fetch draft
  │◀─────── Session + Draft ──────│
  │                               │
  │ (if no session exists)        │
  ├──POST /api/onboarding/start──▶│
  │                               │ Create session, set cookie
  │◀────── New SessionId ─────────│
```

### 2. Resume Upload

```
Client                          Server                      Supabase Storage
  │                               │                              │
  ├─POST /api/onboarding/resume-upload-url─▶│                    │
  │                               │ Generate signed URL          │
  │◀──── { signedUrl, token } ────│                              │
  │                               │                              │
  ├───────── Upload file to signed URL ─────────────────────────▶│
  │                               │                              │
```

### 3. Draft Saving & Analysis

```
Client                          Server                      Database
  │                               │                            │
  ├──POST /api/onboarding/save-draft─▶│                        │
  │  { jdText, resumeBucket, ... }│                            │
  │                               ├──INSERT onboarding_drafts──▶│
  │◀────── { draftId } ───────────│                            │
  │                               │                            │
  ├──POST /api/analyze────────────▶│                            │
  │  { mode, jobDescription,      │ Extract text, run AI       │
  │    resumeFile, focusPrompt }  │                            │
  │◀────── AnalyzeResult ─────────│                            │
```

### 4. Session Claim & Export (After Signup)

```
Client                          Server                      Database
  │                               │                            │
  ├──POST /api/onboarding/claim───▶│                           │
  │                               ├─RPC claim_onboarding_session──▶│
  │                               │ Link user, create job      │
  │◀────── { jobId } ──────────────│                           │
  │                               │                            │
  ├──POST /api/export─────────────▶│                           │
  │  { versionId }                │ Generate PDF               │
  │◀────── { pdfUrl } ────────────│                            │
```

---

## API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/onboarding/start` | POST | Create/resume session |
| `/api/onboarding/session-status` | GET | Get session + draft data |
| `/api/onboarding/resume-upload-url` | POST | Get signed upload URL |
| `/api/onboarding/save-draft` | POST | Save JD + resume metadata |
| `/api/onboarding/delete-resume` | DELETE | Delete resume from storage |
| `/api/onboarding/claim` | POST | Claim session after signup |
| `/api/analyze` | POST | Run ATS analysis on resume |
| `/api/export` | POST | Generate downloadable PDF |
| `/api/jobs/[id]` | GET | Poll job status |

---

## Database Tables

| Table | Purpose |
|-------|---------|
| `onboarding_sessions` | Anonymous session tracking |
| `onboarding_drafts` | User input drafts (JD, resume metadata) |
| `generation_jobs` | Background job queue for PDF generation |
| `tailored_outputs` | Generated resume results |

---

## Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `useResumeForm` | `components/get-started/hooks/` | Central form state management |
| `Step0ModeSelection` | `components/get-started/steps/` | Mode picker UI |
| `Step1InputForm` | `components/get-started/steps/` | JD + Resume input UI |
| `Step2Preview` | `components/get-started/steps/` | Results display UI |

---

## Session States

| State | `isEditable` | Description |
|-------|--------------|-------------|
| `active` | ✅ true | User can input and modify data |
| `claimed` | ❌ false | Session linked to user, locked |
| `expired` | ❌ false | Session past expiration |

---

*Last updated: 2026-01-19*
