import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/guard";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { JobResetSchema } from "@/lib/admin/schemas";

/**
 * POST /api/admin/generations/reset
 *
 * Resets a stuck generation job back to 'queued'.
 * Only allows reset if:
 * - status = 'processing'
 * - updated_at older than 10 minutes
 * - attempt_count < 3
 */
export async function POST(request: Request) {
	let adminUserId: string;
	try {
		const result = await requireAdmin();
		adminUserId = result.adminUserId;
	} catch (err: unknown) {
		const e = err as { status?: number; message?: string };
		return NextResponse.json(
			{ error: e.message },
			{ status: e.status || 403 },
		);
	}

	try {
		const body = await request.json();
		const parsed = JobResetSchema.safeParse(body);

		if (!parsed.success) {
			return NextResponse.json(
				{ error: parsed.error.flatten().fieldErrors },
				{ status: 400 },
			);
		}

		const { jobId, reason } = parsed.data;
		const admin = supabaseAdmin();

		const tenMinutesAgo = new Date(
			Date.now() - 10 * 60 * 1000,
		).toISOString();

		// First, verify the job is actually stuck
		const { data: job, error: jobError } = await admin
			.from("generation_jobs")
			.select("id, status, updated_at, attempt_count, user_id, locked_at")
			.eq("id", jobId)
			.single();

		if (jobError || !job) {
			return NextResponse.json(
				{ error: "Job not found" },
				{ status: 404 },
			);
		}

		if (job.status !== "processing") {
			return NextResponse.json(
				{
					error: `Job is not stuck. Current status: ${job.status}. Only 'processing' jobs can be reset.`,
				},
				{ status: 400 },
			);
		}

		if (job.updated_at > tenMinutesAgo) {
			return NextResponse.json(
				{
					error: "Job was updated less than 10 minutes ago. Wait before resetting — it may still be running.",
				},
				{ status: 400 },
			);
		}

		if (job.attempt_count >= 3) {
			return NextResponse.json(
				{
					error: `Job has reached max attempts (${job.attempt_count}/3). It should not be retried.`,
				},
				{ status: 400 },
			);
		}

		// Reset the job
		const { error: updateError } = await admin
			.from("generation_jobs")
			.update({
				status: "queued",
				progress_stage: "queued",
				locked_at: null,
				lock_id: null,
				updated_at: new Date().toISOString(),
				last_error: `Admin reset: ${reason}`,
			})
			.eq("id", jobId);

		if (updateError) {
			console.error("[Admin Reset Job] Update error:", updateError);
			return NextResponse.json(
				{ error: "Failed to reset job" },
				{ status: 500 },
			);
		}

		// Audit log
		await admin.from("admin_action_logs").insert({
			admin_user_id: adminUserId,
			target_user_id: job.user_id,
			action_type: "job_reset",
			payload: {
				job_id: jobId,
				previous_status: job.status,
				attempt_count: job.attempt_count,
				reason,
			},
		});

		return NextResponse.json({ success: true, jobId });
	} catch (error) {
		console.error("[Admin Reset Job] Error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
