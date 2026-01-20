import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * GET /api/jobs/[id]
 * 
 * Get the status of a generation job.
 * Requires authenticated user. Uses RLS to ensure user can only see their own jobs.
 * 
 * Response:
 * - id: string
 * - status: 'queued' | 'running' | 'succeeded' | 'failed' | 'canceled'
 * - progress: number (0-100)
 * - error_message: string | null
 * - updated_at: string
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 }
      );
    }

    // Require authenticated user (uses RLS)
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    // Fetch job - RLS will ensure user can only see their own jobs
    const { data: job, error: jobError } = await supabase
      .from("generation_jobs")
      .select("id, status, progress, error_message, updated_at")
      .eq("id", id)
      .single();

    if (jobError) {
      console.error("Error fetching job:", jobError);
      if (jobError.code === "PGRST116") {
        return NextResponse.json(
          { error: "Job not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: "Failed to fetch job" },
        { status: 500 }
      );
    }

    if (!job) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: job.id,
      status: job.status,
      progress: job.progress,
      errorMessage: job.error_message,
      updatedAt: job.updated_at,
    });
  } catch (error) {
    console.error("Error in /api/jobs/[id]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
