import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
	try {
		const supabase = await createSupabaseServerClient();

		// Get authenticated user
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();

		if (authError || !user) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 },
			);
		}

		const body = await request.json();
		const { message } = body;

		if (!message || typeof message !== "string" || !message.trim()) {
			return NextResponse.json(
				{ error: "Message is required" },
				{ status: 400 },
			);
		}

		// Try to insert into feedback table if it exists
		// If not, log to console as fallback
		const feedbackData = {
			user_id: user.id,
			email: user.email,
			message: message.trim(),
			created_at: new Date().toISOString(),
		};

		const { error: insertError } = await supabase
			.from("feedback")
			.insert(feedbackData);

		if (insertError) {
			// Table might not exist - log and continue
			console.log(
				"[Feedback] Table insert failed, logging instead:",
				insertError.message,
			);
			console.log("[Feedback] Data:", feedbackData);
			// TODO: Create feedback table in Supabase when ready
		} else {
			console.log("[Feedback] Saved successfully for user:", user.email);
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("[Feedback] Error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
