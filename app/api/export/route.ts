import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
	try {
		const supabase = await createSupabaseServerClient();

		// 1. Verify user is authenticated
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

		const body = await req.json();
		const { versionId } = body ?? {};

		if (!versionId) {
			return NextResponse.json(
				{ error: "Missing versionId" },
				{ status: 400 },
			);
		}

		// 2. Check credits > 0 (authoritative server-side check)
		const { data: currentCredits, error: creditsError } =
			await supabase.rpc("get_credits");

		if (creditsError) {
			console.error("Failed to get credits:", creditsError);
			return NextResponse.json(
				{ error: "Failed to verify credits" },
				{ status: 500 },
			);
		}

		if ((currentCredits ?? 0) <= 0) {
			return NextResponse.json(
				{ error: "Insufficient credits", code: "NO_CREDITS" },
				{ status: 402 },
			);
		}

		// 3. Generate PDF (mock for now)
		// In your real system:
		// - retrieve stored LaTeX for versionId
		// - compile to PDF
		// - upload to storage and return a signed URL

		const latex = `% Full LaTeX would be stored per versionId: ${versionId}
\\documentclass[11pt]{article}
\\begin{document}
Hello from atsresumie export!
\\end{document}
`;

		// 4. On SUCCESS only → decrement credit
		const { data: newBalance, error: decrementError } = await supabase.rpc(
			"adjust_credits",
			{
				p_delta: -1,
				p_reason: "generation",
				p_source: "system",
			},
		);

		if (decrementError) {
			console.error("Failed to decrement credits:", decrementError);
			// Don't fail the request - PDF was generated successfully
			// Log for manual review
		}

		return NextResponse.json({
			pdfUrl: "https://example.com/mock.pdf",
			latex,
			credits: newBalance ?? currentCredits - 1,
		});
	} catch (error) {
		console.error("Export API error:", error);
		return NextResponse.json({ error: "Export failed" }, { status: 500 });
	}
}
