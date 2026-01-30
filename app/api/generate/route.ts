import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { extractTextFromFile } from "@/lib/ats/extractText";
import type { GenerationMode } from "@/lib/llm/claudeLatex";

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
		console.warn("[Generate] Missing env vars for worker kick");
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
		console.log(`[Generate] Worker kick response: ${response.status}`);
	} catch (error) {
		clearTimeout(timeoutId);
		// Best-effort - ignore failures, cron will pick up the job
		console.warn(
			"[Generate] Worker kick failed (will retry via cron):",
			error,
		);
	}
}

export async function POST(req: Request) {
	try {
		const supabase = await createSupabaseServerClient();

		// 1. Verify authentication
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();

		if (authError || !user) {
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 },
			);
		}

		// 2. Check credits > 0
		const { data: credits, error: creditsError } =
			await supabase.rpc("get_credits");

		if (creditsError) {
			console.error("Failed to get credits:", creditsError);
			return NextResponse.json(
				{ error: "Failed to verify credits" },
				{ status: 500 },
			);
		}

		if ((credits ?? 0) <= 0) {
			return NextResponse.json(
				{ error: "Insufficient credits", code: "NO_CREDITS" },
				{ status: 402 },
			);
		}

		// 3. Parse request body
		const body = await req.json();
		const {
			jdText,
			resumeObjectPath,
			resumeText: providedResumeText,
			focusPrompt,
		} = body;
		const mode: GenerationMode = body.mode || "quick";

		// 4. Validate mode is valid
		const validModes: GenerationMode[] = ["quick", "deep", "scratch"];
		if (!validModes.includes(mode)) {
			return NextResponse.json(
				{
					error: "Validation failed",
					fieldErrors: {
						mode: "Mode must be one of: quick, deep, scratch",
					},
				},
				{ status: 400 },
			);
		}

		// 5. Validate required fields
		const fieldErrors: Record<string, string> = {};

		if (!jdText || typeof jdText !== "string") {
			fieldErrors.jdText = "Job description is required";
		} else if (jdText.trim().length < 50) {
			fieldErrors.jdText =
				"Job description must be at least 50 characters";
		}

		// Need either resumeText directly OR resumeObjectPath to extract from
		if (!providedResumeText && !resumeObjectPath) {
			fieldErrors.resumeText = "Resume is required";
		}

		if (Object.keys(fieldErrors).length > 0) {
			return NextResponse.json(
				{ error: "Validation failed", fieldErrors },
				{ status: 400 },
			);
		}

		// 6. Get resume text (from provided text or extract from storage)
		let resumeText: string;
		if (
			providedResumeText &&
			typeof providedResumeText === "string" &&
			providedResumeText.trim().length >= 100
		) {
			resumeText = providedResumeText;
		} else if (resumeObjectPath) {
			try {
				resumeText = await getResumeText(resumeObjectPath);
				console.log(
					`Extracted resume text (${resumeText.length} chars) from ${resumeObjectPath}`,
				);

				// Validate resumeText length
				if (resumeText.trim().length < 100) {
					return NextResponse.json(
						{
							error: "Validation failed",
							fieldErrors: {
								resumeText:
									"Resume content is too short. Please upload a valid resume.",
							},
						},
						{ status: 400 },
					);
				}
			} catch (err) {
				console.error("Failed to extract resume text:", err);
				return NextResponse.json(
					{ error: "Failed to read resume file" },
					{ status: 500 },
				);
			}
		} else {
			return NextResponse.json(
				{
					error: "Validation failed",
					fieldErrors: {
						resumeText:
							"Resume text is too short (minimum 100 characters)",
					},
				},
				{ status: 400 },
			);
		}

		// 7. Create job with status='queued' (enqueue-only, no processing here)
		const { data: job, error: insertError } = await supabase
			.from("generation_jobs")
			.insert({
				user_id: user.id,
				jd_text: jdText,
				resume_text: resumeText,
				resume_object_path: resumeObjectPath || null,
				focus_prompt: focusPrompt || null,
				mode: mode,
				status: "queued",
				progress_stage: "queued",
			})
			.select("id")
			.single();

		if (insertError || !job) {
			console.error("Failed to create job:", insertError);
			return NextResponse.json(
				{ error: "Failed to create generation job" },
				{ status: 500 },
			);
		}

		console.log(
			`[Generate] Created job ${job.id} with status=queued, mode=${mode}`,
		);

		// 8. Best-effort kick to Edge Function (non-blocking)
		// Don't await - let it run in background, response returns immediately
		kickWorker(job.id).catch((err) => {
			console.warn("[Generate] Background kick error:", err);
		});

		// 9. Return jobId immediately
		return NextResponse.json({ jobId: job.id });
	} catch (error) {
		console.error("Generate API error:", error);
		return NextResponse.json(
			{ error: "Failed to start generation" },
			{ status: 500 },
		);
	}
}
