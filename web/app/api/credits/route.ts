import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET() {
	try {
		const supabase = await createSupabaseServerClient();

		// Check if user is authenticated
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();

		if (authError || !user) {
			return NextResponse.json({ credits: 0 }, { status: 200 });
		}

		// Get credits via RPC
		const { data, error } = await supabase.rpc("get_credits");

		if (error) {
			console.error("Failed to get credits:", error);
			// Return 0 if no profile exists yet
			return NextResponse.json({ credits: 0 }, { status: 200 });
		}

		return NextResponse.json({ credits: data ?? 0 });
	} catch (error) {
		console.error("Credits API error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch credits" },
			{ status: 500 },
		);
	}
}
