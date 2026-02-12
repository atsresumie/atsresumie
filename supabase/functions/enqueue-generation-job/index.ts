// ==========================================================
// Supabase Edge Function: enqueue-generation-job
// User-facing fast endpoint. Creates a job row and returns.
// ==========================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers":
		"authorization, x-client-info, apikey, content-type",
};

// Payload size limits
const MAX_JD_LENGTH = 50_000;
const MAX_RESUME_LENGTH = 100_000;
const MIN_JD_LENGTH = 50;
const MIN_RESUME_LENGTH = 100;
const VALID_MODES = ["quick", "deep", "scratch"];

Deno.serve(async (req) => {
	// CORS preflight
	if (req.method === "OPTIONS") {
		return new Response("ok", { headers: corsHeaders });
	}

	try {
		const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
		const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

		// 1. Require JWT auth — extract from Authorization header
		const authHeader = req.headers.get("Authorization");
		if (!authHeader) {
			return new Response(
				JSON.stringify({ error: "Authentication required" }),
				{
					status: 401,
					headers: {
						...corsHeaders,
						"Content-Type": "application/json",
					},
				},
			);
		}

		// Create client with user's JWT to enforce RLS
		const supabase = createClient(supabaseUrl, supabaseAnonKey, {
			global: { headers: { Authorization: authHeader } },
		});

		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();

		if (authError || !user) {
			return new Response(
				JSON.stringify({ error: "Invalid or expired token" }),
				{
					status: 401,
					headers: {
						...corsHeaders,
						"Content-Type": "application/json",
					},
				},
			);
		}

		// 2. Parse & validate body
		let body: Record<string, unknown>;
		try {
			body = await req.json();
		} catch {
			return new Response(
				JSON.stringify({ error: "Invalid JSON body" }),
				{
					status: 400,
					headers: {
						...corsHeaders,
						"Content-Type": "application/json",
					},
				},
			);
		}

		const { jd_text, resume_text, mode, focus_prompt, resume_object_path } =
			body as {
				jd_text?: string;
				resume_text?: string;
				mode?: string;
				focus_prompt?: string;
				resume_object_path?: string;
			};

		const fieldErrors: Record<string, string> = {};

		// Validate jd_text
		if (!jd_text || typeof jd_text !== "string") {
			fieldErrors.jd_text = "Job description is required";
		} else if (jd_text.length < MIN_JD_LENGTH) {
			fieldErrors.jd_text = `Job description must be at least ${MIN_JD_LENGTH} characters`;
		} else if (jd_text.length > MAX_JD_LENGTH) {
			fieldErrors.jd_text = `Job description exceeds maximum length (${MAX_JD_LENGTH} chars)`;
		}

		// Validate resume_text
		if (!resume_text || typeof resume_text !== "string") {
			fieldErrors.resume_text = "Resume text is required";
		} else if (resume_text.length < MIN_RESUME_LENGTH) {
			fieldErrors.resume_text = `Resume must be at least ${MIN_RESUME_LENGTH} characters`;
		} else if (resume_text.length > MAX_RESUME_LENGTH) {
			fieldErrors.resume_text = `Resume exceeds maximum length (${MAX_RESUME_LENGTH} chars)`;
		}

		// Validate mode
		const validatedMode = mode || "quick";
		if (!VALID_MODES.includes(validatedMode)) {
			fieldErrors.mode = `Mode must be one of: ${VALID_MODES.join(", ")}`;
		}

		if (Object.keys(fieldErrors).length > 0) {
			return new Response(
				JSON.stringify({ error: "Validation failed", fieldErrors }),
				{
					status: 400,
					headers: {
						...corsHeaders,
						"Content-Type": "application/json",
					},
				},
			);
		}

		// 3. Check credits > 0
		const { data: credits, error: creditsError } =
			await supabase.rpc("get_credits");

		if (creditsError) {
			console.error("Failed to check credits:", creditsError);
			return new Response(
				JSON.stringify({ error: "Failed to verify credits" }),
				{
					status: 500,
					headers: {
						...corsHeaders,
						"Content-Type": "application/json",
					},
				},
			);
		}

		if ((credits ?? 0) <= 0) {
			return new Response(
				JSON.stringify({
					error: "Insufficient credits",
					code: "NO_CREDITS",
				}),
				{
					status: 402,
					headers: {
						...corsHeaders,
						"Content-Type": "application/json",
					},
				},
			);
		}

		// 4. Insert job row
		const { data: job, error: insertError } = await supabase
			.from("generation_jobs")
			.insert({
				user_id: user.id,
				jd_text: jd_text!,
				resume_text: resume_text!,
				resume_object_path: resume_object_path || null,
				focus_prompt: focus_prompt || null,
				mode: validatedMode,
				status: "queued",
				progress_stage: "queued",
				pdf_status: "none",
			})
			.select("id")
			.single();

		if (insertError || !job) {
			console.error("Insert error:", insertError);
			return new Response(
				JSON.stringify({ error: "Failed to create job" }),
				{
					status: 500,
					headers: {
						...corsHeaders,
						"Content-Type": "application/json",
					},
				},
			);
		}

		console.log(`[Enqueue] Created job ${job.id} for user ${user.id}`);

		// 5. Return immediately
		return new Response(JSON.stringify({ jobId: job.id }), {
			status: 200,
			headers: { ...corsHeaders, "Content-Type": "application/json" },
		});
	} catch (error) {
		console.error("[Enqueue] Unexpected error:", error);
		return new Response(
			JSON.stringify({
				error: error instanceof Error ? error.message : "Unknown error",
			}),
			{
				status: 500,
				headers: { ...corsHeaders, "Content-Type": "application/json" },
			},
		);
	}
});
