import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Mock processing function - replace with real Claude/LaTeX/PDF pipeline later
async function processJob(jobId: string, userId: string) {
	const supabase = supabaseAdmin();

	try {
		// 1. Set status to 'running'
		await supabase.rpc("update_job_status", {
			p_job_id: jobId,
			p_status: "running",
		});

		// 2. Simulate work (replace with real processing)
		// TODO: Replace this block with:
		// - Fetch resume text from storage
		// - Call Claude API with jd_text + resume_text + focus_prompt
		// - Generate LaTeX from Claude response
		// - Call LaTeX compiler to generate PDF
		// - Upload PDF to Supabase Storage
		// - Get signed URL
		await new Promise((resolve) => setTimeout(resolve, 1500));

		// 3. Mock outputs (replace with real outputs)
		const mockLatex = `\\documentclass[11pt]{article}
\\begin{document}
% Mock LaTeX generated for job ${jobId}
\\section{Resume}
This is a mock resume optimized for the job description.
\\end{document}`;
		const mockPdfUrl = `https://example.com/mock-resume-${jobId}.pdf`;

		// 4. Decrement credit BEFORE marking success (using admin RPC with explicit user_id)
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
			console.error("Credit decrement failed:", creditError);
			await supabase.rpc("update_job_status", {
				p_job_id: jobId,
				p_status: "failed",
				p_error_message: "Credit processing failed. Please try again.",
			});
			return;
		}

		// 5. Mark job as succeeded with outputs
		await supabase.rpc("update_job_status", {
			p_job_id: jobId,
			p_status: "succeeded",
			p_latex_text: mockLatex,
			p_pdf_url: mockPdfUrl,
		});
	} catch (error) {
		console.error("Job processing failed:", error);

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

		if (!jdText) {
			return NextResponse.json(
				{ error: "Job description is required" },
				{ status: 400 },
			);
		}

		// 4. Create job with status='pending'
		const { data: job, error: insertError } = await supabase
			.from("generation_jobs")
			.insert({
				user_id: user.id,
				jd_text: jdText,
				resume_object_path: resumeObjectPath || null,
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

		// 5. Start processing asynchronously (fire and forget)
		// Note: In production, use a proper queue (Supabase Edge Functions, etc.)
		processJob(job.id, user.id).catch((err) => {
			console.error("Background job processing error:", err);
		});

		// 6. Return jobId immediately
		return NextResponse.json({ jobId: job.id });
	} catch (error) {
		console.error("Generate API error:", error);
		return NextResponse.json(
			{ error: "Failed to start generation" },
			{ status: 500 },
		);
	}
}
