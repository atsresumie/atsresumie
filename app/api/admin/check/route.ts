import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * GET /api/admin/check
 *
 * Lightweight endpoint that returns { isAdmin: boolean }.
 * Used by the dashboard sidebar to conditionally show the admin link.
 */
export async function GET() {
	try {
		const supabase = await createSupabaseServerClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			return NextResponse.json({ isAdmin: false });
		}

		const admin = supabaseAdmin();
		const { data: profile } = await admin
			.from("user_profiles")
			.select("is_admin")
			.eq("id", user.id)
			.single();

		return NextResponse.json({
			isAdmin: profile?.is_admin === true,
		});
	} catch {
		return NextResponse.json({ isAdmin: false });
	}
}
