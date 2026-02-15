import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getOnboardingSessionId } from "@/lib/onboarding/cookie";

export interface SessionStatusResponse {
  sessionId: string;
  status: "active" | "claimed" | "expired";
  isEditable: boolean;
  draft: {
    jdText: string;
    jdTitle: string | null;
    jdCompany: string | null;
    resumeOriginalFilename: string | null;
    resumeBucket: string | null;
    resumeObjectPath: string | null;
  } | null;
}

/**
 * GET /api/onboarding/session-status
 * 
 * Returns the current session status and any existing draft data.
 * This allows the client to restore previous work when the user returns.
 */
export async function GET() {
  try {
    const sessionId = await getOnboardingSessionId();

    if (!sessionId) {
      return NextResponse.json(
        { error: "No session found", hasSession: false },
        { status: 200 }
      );
    }

    const admin = supabaseAdmin();

    // Fetch session with its latest draft
    const { data: session, error: sessionError } = await admin
      .from("onboarding_sessions")
      .select(`
        id,
        status,
        expires_at,
        user_id,
        onboarding_drafts (
          id,
          jd_text,
          jd_title,
          jd_company,
          resume_original_filename,
          resume_bucket,
          resume_object_path,
          created_at
        )
      `)
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      console.error("Session not found:", sessionError);
      return NextResponse.json(
        { error: "Session not found", hasSession: false },
        { status: 200 }
      );
    }

    // Determine status
    const isExpired = new Date(session.expires_at) <= new Date();
    const isClaimed = session.status === "claimed" || session.user_id !== null;
    
    let status: "active" | "claimed" | "expired";
    if (isExpired) {
      status = "expired";
    } else if (isClaimed) {
      status = "claimed";
    } else {
      status = "active";
    }

    const isEditable = status === "active";

    // Get the most recent draft (if any)
    const drafts = session.onboarding_drafts as Array<{
      id: string;
      jd_text: string;
      jd_title: string | null;
      jd_company: string | null;
      resume_original_filename: string | null;
      resume_bucket: string | null;
      resume_object_path: string | null;
      created_at: string;
    }> | null;

    let draft: SessionStatusResponse["draft"] = null;
    
    if (drafts && drafts.length > 0) {
      // Sort by created_at descending and get the latest
      const latestDraft = drafts.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )[0];
      
      draft = {
        jdText: latestDraft.jd_text,
        jdTitle: latestDraft.jd_title,
        jdCompany: latestDraft.jd_company,
        resumeOriginalFilename: latestDraft.resume_original_filename,
        resumeBucket: latestDraft.resume_bucket,
        resumeObjectPath: latestDraft.resume_object_path,
      };
    }

    const response: SessionStatusResponse = {
      sessionId: session.id,
      status,
      isEditable,
      draft,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in /api/onboarding/session-status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
