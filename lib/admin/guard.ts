import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * requireAdmin — API route guard (server-only)
 *
 * 1. Reads the session from cookies
 * 2. Checks is_admin on user_profiles via service role
 * 3. Returns { adminUserId } or throws an object with { status, message }
 */
export async function requireAdmin(): Promise<{ adminUserId: string }> {
	const supabase = await createSupabaseServerClient();
	const {
		data: { user },
		error: authError,
	} = await supabase.auth.getUser();

	if (authError || !user) {
		throw { status: 401, message: "Not authenticated" };
	}

	const admin = supabaseAdmin();
	const { data: profile, error: profileError } = await admin
		.from("user_profiles")
		.select("is_admin")
		.eq("id", user.id)
		.single();

	if (profileError || !profile?.is_admin) {
		throw { status: 403, message: "Admin access required" };
	}

	return { adminUserId: user.id };
}

/**
 * getIsAdmin — Server component helper (server-only)
 *
 * Returns true if the current session user is an admin.
 * Returns false on any error (not authenticated, no profile, etc.)
 */
export async function getIsAdmin(): Promise<boolean> {
	try {
		const supabase = await createSupabaseServerClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) return false;

		const admin = supabaseAdmin();
		const { data: profile } = await admin
			.from("user_profiles")
			.select("is_admin")
			.eq("id", user.id)
			.single();

		return profile?.is_admin === true;
	} catch {
		return false;
	}
}
