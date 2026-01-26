import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { extractTextFromFile } from "@/lib/ats/extractText";
import {
	generateLatexWithClaude,
	validateQuickModeInputs,
	GenerationMode,
	QuickModeInputs,
} from "@/lib/llm/claudeLatex";

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
 * Process a generation job with Claude LaTeX generation
 */
async function processJob(
	jobId: string,
	userId: string,
	jdText: string,
	resumeText: string,
	mode: GenerationMode,
	focusPrompt?: string,
) {
	const supabase = supabaseAdmin();

	try {
		// 1. Set status to 'running'
		await supabase.rpc("update_job_status", {
			p_job_id: jobId,
			p_status: "running",
		});

		// 2. Build inputs for Claude
		// Note: Currently only 'quick' mode is fully supported. Deep/scratch modes
		// require additional inputs from the UI questionnaire (to be implemented).
		// For now, treat all modes as quick mode for LaTeX generation.
		const inputs: QuickModeInputs = {
			mode: "quick",
			jdText,
			resumeText,
			targetTitle: focusPrompt, // Use focus prompt as target title hint
		};

		// 3. Generate LaTeX using Claude
		console.log(
			`[Job ${jobId}] Starting Claude LaTeX generation (requested mode: ${mode}, using: quick)`,
		);
		const result = await generateLatexWithClaude(inputs);

		if (!result.success || !result.latex) {
			// Generation failed - mark job as failed, DO NOT decrement credits
			console.error(
				`[Job ${jobId}] Claude generation failed:`,
				result.error,
			);
			await supabase.rpc("update_job_status", {
				p_job_id: jobId,
				p_status: "failed",
				p_error_message:
					result.error ||
					"Resume generation failed. Please try again.",
			});
			return;
		}

		console.log(
			`[Job ${jobId}] LaTeX generation successful (${result.latex.length} chars)`,
		);

		// 4. Decrement credit ONLY on success (using admin RPC with explicit user_id)
		const { error: creditError } = await supabase.rpc(
			"adjust_credits_for_user",
			{
				p_user_id: userId,
				p_delta: -1,
				p_reason: "generation",
				p_source: "system",
			},
		);

		if (creditError) {
			// Credit decrement failed - mark job as failed
			console.error(
				`[Job ${jobId}] Credit decrement failed:`,
				creditError,
			);
			await supabase.rpc("update_job_status", {
				p_job_id: jobId,
				p_status: "failed",
				p_error_message: "Credit processing failed. Please try again.",
			});
			return;
		}

		// 5. Mark job as succeeded with LaTeX output
		// Note: PDF URL is null for now - PDF compilation will be implemented later
		await supabase.rpc("update_job_status", {
			p_job_id: jobId,
			p_status: "succeeded",
			p_latex_text: result.latex,
			p_pdf_url: null, // PDF compilation not yet implemented
		});

		console.log(`[Job ${jobId}] Job completed successfully`);
	} catch (error) {
		console.error(`[Job ${jobId}] Job processing failed:`, error);

		// Mark job as failed - DO NOT decrement credits
		await supabase.rpc("update_job_status", {
			p_job_id: jobId,
			p_status: "failed",
			p_error_message: "Generation failed. Please try again.",
		});
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
		const { jdText, resumeObjectPath, focusPrompt } = body;
		const mode: GenerationMode = body.mode || "quick";

		// 4. Validate required fields
		if (!jdText) {
			return NextResponse.json(
				{ error: "Job description is required" },
				{ status: 400 },
			);
		}

		if (!resumeObjectPath) {
			return NextResponse.json(
				{ error: "Resume is required" },
				{ status: 400 },
			);
		}

		// 5. Extract resume text from storage
		let resumeText: string;
		try {
			resumeText = await getResumeText(resumeObjectPath);
			console.log(
				`Extracted resume text (${resumeText.length} chars) from ${resumeObjectPath}`,
			);
		} catch (err) {
			console.error("Failed to extract resume text:", err);
			return NextResponse.json(
				{ error: "Failed to read resume file" },
				{ status: 500 },
			);
		}

		// 6. Create job with status='pending'
		const { data: job, error: insertError } = await supabase
			.from("generation_jobs")
			.insert({
				user_id: user.id,
				jd_text: jdText,
				resume_object_path: resumeObjectPath,
				focus_prompt: focusPrompt || null,
				status: "pending",
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

		// 7. Start processing asynchronously (fire and forget)
		// Note: In production, use a proper queue (Supabase Edge Functions, etc.)
		processJob(
			job.id,
			user.id,
			jdText,
			resumeText,
			mode,
			focusPrompt,
		).catch((err) => {
			console.error("Background job processing error:", err);
		});

		// 8. Return jobId immediately
		return NextResponse.json({ jobId: job.id });
	} catch (error) {
		console.error("Generate API error:", error);
		return NextResponse.json(
			{ error: "Failed to start generation" },
			{ status: 500 },
		);
	}
}
