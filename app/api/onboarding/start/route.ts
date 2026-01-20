import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  getOnboardingSessionId,
  setOnboardingSessionId,
  clearOnboardingSessionId,
} from "@/lib/onboarding/cookie";
import { sha256 } from "@/lib/utils/hash";

interface StartRequestBody {
  forceNew?: boolean;
}

/**
 * POST /api/onboarding/start
 * 
 * Start or resume an anonymous onboarding session.
 * - If forceNew is true, always create a new session
 * - If cookie exists and session is valid, return existing sessionId
 * - Otherwise, create new session in DB and set cookie
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body for forceNew flag
    let forceNew = false;
    try {
      const body = await request.json() as StartRequestBody;
      forceNew = body.forceNew === true;
    } catch {
      // No body or invalid JSON is fine, just use defaults
    }

    // Clear existing session if forceNew
    if (forceNew) {
      await clearOnboardingSessionId();
    }

    // Check for existing session cookie (unless forceNew)
    if (!forceNew) {
      const existingSessionId = await getOnboardingSessionId();

      if (existingSessionId) {
        // Verify session exists and is active in DB
        const admin = supabaseAdmin();
        const { data: session } = await admin
          .from("onboarding_sessions")
          .select("id, status, expires_at")
          .eq("id", existingSessionId)
          .single();

        if (
          session &&
          session.status === "active" &&
          new Date(session.expires_at) > new Date()
        ) {
          return NextResponse.json({ sessionId: existingSessionId });
        }
        // Session is invalid/expired, will create new one below
      }
    }

    // Get IP and user agent for analytics
    const headersList = await headers();
    const forwardedFor = headersList.get("x-forwarded-for");
    const ip = forwardedFor?.split(",")[0]?.trim() || "unknown";
    const ipHash = sha256(ip);
    const userAgent = headersList.get("user-agent") || null;

    // Create new session
    const admin = supabaseAdmin();
    const { data: newSession, error } = await admin
      .from("onboarding_sessions")
      .insert({
        ip_hash: ipHash,
        user_agent: userAgent,
        status: "active",
      })
      .select("id")
      .single();

    if (error || !newSession) {
      console.error("Failed to create onboarding session:", error);
      return NextResponse.json(
        { error: "Failed to create session" },
        { status: 500 }
      );
    }

    // Set cookie
    await setOnboardingSessionId(newSession.id);

    return NextResponse.json({ sessionId: newSession.id });
  } catch (error) {
    console.error("Error in /api/onboarding/start:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
