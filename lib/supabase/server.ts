import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSupabaseServerClient() {
	const cookieStore = await cookies();
	const isProduction = process.env.NODE_ENV === "production";
	const cookieDomain = isProduction ? ".atsresumie.com" : undefined;

	return createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{
			cookies: {
				getAll() {
					return cookieStore.getAll();
				},
				setAll(cookiesToSet) {
					try {
						cookiesToSet.forEach(({ name, value, options }) => {
							cookieStore.set(name, value, {
								...options,
								domain: cookieDomain,
							});
						});
					} catch {
						// The `setAll` method is called from a Server Component.
						// This can be ignored if you have middleware refreshing sessions.
					}
				},
			},
			cookieOptions: {
				domain: cookieDomain,
				path: "/",
				sameSite: "lax" as const,
				secure: isProduction,
			},
		},
	);
}
