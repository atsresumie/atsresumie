import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Extract subdomain from hostname.
 * Handles: admin.atsresumie.com, admin.localhost, etc.
 */
function getSubdomain(hostname: string): string | null {
	// Remove port if present
	const host = hostname.split(":")[0];

	// Local dev: admin.localhost
	if (host.endsWith(".localhost")) {
		return host.replace(".localhost", "");
	}

	// Production: admin.atsresumie.com
	const parts = host.split(".");
	if (parts.length >= 3) {
		// e.g. ["admin", "atsresumie", "com"]
		return parts[0];
	}

	return null;
}

export async function middleware(request: NextRequest) {
	const hostname = request.headers.get("host") || "";
	const subdomain = getSubdomain(hostname);
	const pathname = request.nextUrl.pathname;

	// ── Compute effective path for auth check ─────────────────────────────
	// On admin subdomain, / → /dashboard/admin, /users → /dashboard/admin/users
	let adminRewritePath: string | null = null;

	if (subdomain === "admin") {
		const shouldRewrite =
			!pathname.startsWith("/api/") &&
			!pathname.startsWith("/_next/") &&
			!pathname.startsWith("/dashboard") &&
			pathname !== "/favicon.ico" &&
			!pathname.endsWith(".webmanifest");

		if (shouldRewrite) {
			adminRewritePath =
				pathname === "/"
					? "/dashboard/admin"
					: `/dashboard/admin${pathname}`;
		}
	}

	// The path to check for auth — either the rewrite target or the original
	const effectivePath = adminRewritePath || pathname;

	// ── Supabase session refresh ──────────────────────────────────────────
	let supabaseResponse = NextResponse.next({
		request,
	});

	const supabase = createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{
			cookies: {
				getAll() {
					return request.cookies.getAll();
				},
				setAll(cookiesToSet) {
					cookiesToSet.forEach(({ name, value }) =>
						request.cookies.set(name, value),
					);
					supabaseResponse = NextResponse.next({
						request,
					});
					cookiesToSet.forEach(({ name, value, options }) =>
						supabaseResponse.cookies.set(name, value, options),
					);
				},
			},
		},
	);

	// Refresh session if expired - required for Server Components
	const {
		data: { user },
	} = await supabase.auth.getUser();

	// ── Auth check (runs BEFORE admin rewrite) ────────────────────────────
	const isDashboardRoute = effectivePath.startsWith("/dashboard");
	if (isDashboardRoute && !user) {
		// For admin subdomain → redirect to MAIN domain login, not admin subdomain
		if (subdomain === "admin") {
			const mainDomain = process.env.APP_URL || "http://localhost:3000";
			const mainUrl = new URL(mainDomain);
			mainUrl.pathname = "/";
			mainUrl.searchParams.set("authRequired", "true");
			mainUrl.searchParams.set("next", "/dashboard/admin");
			return NextResponse.redirect(mainUrl);
		}

		const redirectUrl = new URL("/", request.url);
		redirectUrl.searchParams.set("authRequired", "true");
		redirectUrl.searchParams.set("next", effectivePath);
		return NextResponse.redirect(redirectUrl);
	}

	// ── Admin subdomain rewrite (AFTER auth check passes) ─────────────────
	if (adminRewritePath) {
		const url = request.nextUrl.clone();
		url.pathname = adminRewritePath;
		return NextResponse.rewrite(url);
	}

	return supabaseResponse;
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * - public folder
		 */
		"/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
	],
};
