import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getOnboardingSessionId } from "@/lib/onboarding/cookie";

/**
 * DELETE /api/onboarding/delete-resume
 * 
 * Delete the uploaded resume from storage.
 * Requires an active onboarding session (cookie).
 */
export async function DELETE(request: NextRequest) {
  try {
    // Require session cookie
    const sessionId = await getOnboardingSessionId();
    if (!sessionId) {
      return NextResponse.json(
        { error: "No onboarding session found" },
        { status: 400 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { bucket, objectPath } = body;

    if (!bucket || !objectPath) {
      return NextResponse.json(
        { error: "bucket and objectPath are required" },
        { status: 400 }
      );
    }

    const admin = supabaseAdmin();

    // Verify session exists and is active
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

    // Delete file from storage
    const { error: deleteError } = await admin.storage
      .from(bucket)
      .remove([objectPath]);

    if (deleteError) {
      console.error("Failed to delete file:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete file" },
        { status: 500 }
      );
    }

    // Also delete the draft record if it exists
    await admin
      .from("onboarding_drafts")
      .delete()
      .eq("session_id", sessionId)
      .eq("resume_object_path", objectPath);

    console.log(`Deleted file: ${bucket}/${objectPath}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in /api/onboarding/delete-resume:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
