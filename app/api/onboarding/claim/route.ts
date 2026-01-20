import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOnboardingSessionId } from "@/lib/onboarding/cookie";

/**
 * POST /api/onboarding/claim
 * 
 * Claim an anonymous onboarding session after user signs up.
 * Requires both:
 * - An active onboarding session (cookie)
 * - An authenticated user (Supabase auth)
 * 
 * This will:
 * 1. Call RPC claim_onboarding_session to link session to user
 * 2. Find the latest draft for this session
 * 3. Create a generation_jobs entry with status='queued'
 * 
 * Response:
 * - jobId: string
 */
export async function POST() {
  try {
    // Require session cookie
    const sessionId = await getOnboardingSessionId();
    if (!sessionId) {
      return NextResponse.json(
        { error: "No onboarding session found." },
        { status: 400 }
      );
    }

    // Require authenticated user (use server client with RLS)
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to claim your session." },
        { status: 401 }
      );
    }

    // Call RPC to claim the session
    const { error: claimError } = await supabase.rpc(
      "claim_onboarding_session",
      { p_session_id: sessionId }
    );

    if (claimError) {
      console.error("Failed to claim session:", claimError);
      // Check for specific error cases
      if (claimError.message.includes("expired") || claimError.message.includes("not active")) {
        return NextResponse.json(
          { error: "Session is expired or already claimed." },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: "Failed to claim session" },
        { status: 500 }
      );
    }

    // Find the latest draft for this session (use admin to ensure we get it)
    const admin = supabaseAdmin();
    const { data: draft, error: draftError } = await admin
      .from("onboarding_drafts")
      .select("id")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (draftError || !draft) {
      console.error("No draft found for session:", draftError);
      return NextResponse.json(
        { error: "No draft found for this session. Please complete the onboarding form first." },
        { status: 400 }
      );
    }

    // Create generation job
    const { data: job, error: jobError } = await admin
      .from("generation_jobs")
      .insert({
        session_id: sessionId,
        user_id: user.id,
        draft_id: draft.id,
        status: "queued",
        progress: 0,
      })
      .select("id")
      .single();

    if (jobError || !job) {
      console.error("Failed to create generation job:", jobError);
      return NextResponse.json(
        { error: "Failed to create generation job" },
        { status: 500 }
      );
    }

    return NextResponse.json({ jobId: job.id });
  } catch (error) {
    console.error("Error in /api/onboarding/claim:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
