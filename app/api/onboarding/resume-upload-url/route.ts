import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getOnboardingSessionId } from "@/lib/onboarding/cookie";
import { sanitizeFilename } from "@/lib/utils/sanitize";

// Allowed MIME types for resume upload
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

function isAllowedMimeType(mimeType: string): mimeType is AllowedMimeType {
  return ALLOWED_MIME_TYPES.includes(mimeType as AllowedMimeType);
}

/**
 * POST /api/onboarding/resume-upload-url
 * 
 * Generate a signed upload URL for resume file upload.
 * Requires an active onboarding session (cookie).
 * 
 * Request body:
 * - filename: string
 * - mimeType: string (must be PDF or DOCX)
 * - fileSize?: number (optional, for validation)
 * 
 * Response:
 * - bucket: string
 * - objectPath: string
 * - signedUrl: string
 * - token: string
 */
export async function POST(request: NextRequest) {
  try {
    // Require session cookie
    const sessionId = await getOnboardingSessionId();
    if (!sessionId) {
      return NextResponse.json(
        { error: "No onboarding session found. Please start a session first." },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { filename, mimeType, fileSize } = body as {
      filename?: string;
      mimeType?: string;
      fileSize?: number;
    };

    // Validate required fields
    if (!filename || typeof filename !== "string") {
      return NextResponse.json(
        { error: "filename is required" },
        { status: 400 }
      );
    }

    if (!mimeType || typeof mimeType !== "string") {
      return NextResponse.json(
        { error: "mimeType is required" },
        { status: 400 }
      );
    }

    // Validate MIME type
    if (!isAllowedMimeType(mimeType)) {
      return NextResponse.json(
        { error: "Invalid file type. Only PDF and DOCX files are allowed." },
        { status: 400 }
      );
    }

    // Optional: Validate file size (10MB max)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (fileSize && fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds maximum allowed (10MB)" },
        { status: 400 }
      );
    }

    // Verify session exists and is active
    const admin = supabaseAdmin();
    const { data: session, error: sessionError } = await admin
      .from("onboarding_sessions")
      .select("id, status, expires_at")
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 400 }
      );
    }

    if (session.status !== "active") {
      return NextResponse.json(
        { error: "Session is no longer active" },
        { status: 400 }
      );
    }

    if (new Date(session.expires_at) <= new Date()) {
      return NextResponse.json(
        { error: "Session has expired" },
        { status: 400 }
      );
    }

    // Build object path
    const bucket = "user-resumes";
    const timestamp = Date.now();
    const sanitizedName = sanitizeFilename(filename);
    const objectPath = `sessions/${sessionId}/${timestamp}-${sanitizedName}`;

    // Create signed upload URL
    const { data: signedData, error: signedError } = await admin.storage
      .from(bucket)
      .createSignedUploadUrl(objectPath);

    if (signedError || !signedData) {
      console.error("Failed to create signed upload URL:", signedError);
      return NextResponse.json(
        { error: "Failed to create upload URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      bucket,
      objectPath,
      signedUrl: signedData.signedUrl,
      token: signedData.token,
    });
  } catch (error) {
    console.error("Error in /api/onboarding/resume-upload-url:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
