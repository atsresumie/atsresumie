import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getOnboardingSessionId } from "@/lib/onboarding/cookie";
import { extractTextFromFile } from "@/lib/ats/extractText";

/**
 * Extract resume text from Supabase Storage
 */
async function getResumeText(
	resumeObjectPath: string,
	bucket: string = "user-resumes",
): Promise<string> {
	const supabase = supabaseAdmin();

	const { data, error } = await supabase.storage
		.from(bucket)
		.download(resumeObjectPath);

	if (error || !data) {
		throw new Error(`Failed to download resume: ${error?.message}`);
	}

	// Convert blob to File for extraction
	const storedFile = new File(
		[data],
		resumeObjectPath.split("/").pop() || "resume",
		{
			type: data.type,
		},
	);

	return await extractTextFromFile(storedFile);
}

/**
 * Best-effort kick to Edge Function worker (fire-and-forget with timeout)
 */
async function kickWorker(jobId: string): Promise<void> {
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

	if (!supabaseUrl || !serviceKey) {
		console.warn("[Claim] Missing env vars for worker kick");
		return;
	}

	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

	try {
		const response = await fetch(
			`${supabaseUrl}/functions/v1/process-generation-job`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${serviceKey}`,
				},
				body: JSON.stringify({ jobId }),
				signal: controller.signal,
			},
		);
		clearTimeout(timeoutId);
		console.log(`[Claim] Worker kick response: ${response.status}`);
	} catch (error) {
		clearTimeout(timeoutId);
		console.warn(
			"[Claim] Worker kick failed (will retry via cron):",
			error,
		);
	}
}

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
 * 3. Create a generation_jobs entry with status='queued' (using draft content)
 * 4. Kick the worker
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
				{ status: 400 },
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
				{
					error: "Unauthorized. Please sign in to claim your session.",
				},
				{ status: 401 },
			);
		}

		// Call RPC to claim the session
		const { error: claimError } = await supabase.rpc(
			"claim_onboarding_session",
			{ p_session_id: sessionId },
		);

		if (claimError) {
			console.error("Failed to claim session:", claimError);
			// Check for specific error cases
			if (
				claimError.message.includes("expired") ||
				claimError.message.includes("not active")
			) {
				return NextResponse.json(
					{ error: "Session is expired or already claimed." },
					{ status: 400 },
				);
			}
			return NextResponse.json(
				{ error: "Failed to claim session" },
				{ status: 500 },
			);
		}

		// Find the latest draft for this session (use admin to ensure we get it)
		const admin = supabaseAdmin();
		const { data: draft, error: draftError } = await admin
			.from("onboarding_drafts")
			.select("*")
			.eq("session_id", sessionId)
			.order("created_at", { ascending: false })
			.limit(1)
			.single();

		if (draftError || !draft) {
			console.error("No draft found for session:", draftError);
			return NextResponse.json(
				{
					error: "No draft found for this session. Please complete the onboarding form first.",
				},
				{ status: 400 },
			);
		}

		// Prepare resume text
		let resumeText = draft.resume_extracted_text;
		if (!resumeText && draft.resume_object_path) {
			try {
				console.log(
					`[Claim] Extracting text for draft ${draft.id} from ${draft.resume_object_path}`,
				);
				resumeText = await getResumeText(
					draft.resume_object_path,
					draft.resume_bucket,
				);
			} catch (err) {
				console.error("Failed to extract resume text for claim:", err);
			}
		}

		if (!resumeText) {
			return NextResponse.json(
				{ error: "Could not retrieve resume text from draft." },
				{ status: 400 },
			);
		}

		// Create generation job
		// IMPORTANT: Maps draft fields to generation_jobs schema
		// NO session_id or draft_id in generation_jobs table
		const { data: job, error: jobError } = await admin
			.from("generation_jobs")
			.insert({
				user_id: user.id,
				jd_text: draft.jd_text,
				resume_text: resumeText,
				resume_object_path: draft.resume_object_path,
				focus_prompt: null,
				mode: "quick", // Default for onboarding
				status: "queued",
				progress_stage: "queued",
			})
			.select("id")
			.single();

		if (jobError || !job) {
			console.error("Failed to create generation job:", jobError);
			return NextResponse.json(
				{ error: "Failed to create generation job" },
				{ status: 500 },
			);
		}

		console.log(`[Claim] Created job ${job.id} for user ${user.id}`);

		// Kick the worker
		kickWorker(job.id).catch((err) => {
			console.warn("[Claim] Background kick failed:", err);
		});

		return NextResponse.json({ jobId: job.id });
	} catch (error) {
		console.error("Error in /api/onboarding/claim:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
