/**
 * POST /api/stripe/portal
 *
 * Creates a Stripe Billing Portal session for the authenticated user.
 *
 * Security:
 * - Requires authentication via Supabase session
 * - stripe_customer_id is derived from the logged-in user's DB record only
 * - No user-provided IDs — prevents opening portal for another customer
 */

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getStripeClient } from "@/lib/stripe/client";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: Request) {
	try {
		// 1. Verify authentication
		const supabase = await createSupabaseServerClient();
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();

		if (authError || !user) {
			console.error("[Portal] Auth failed:", authError?.message);
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 },
			);
		}

		// 2. Fetch stripe_customer_id from DB (service role for reliable read)
		const admin = supabaseAdmin();
		const { data: profile, error: profileError } = await admin
			.from("user_profiles")
			.select("stripe_customer_id")
			.eq("id", user.id)
			.single();

		if (profileError) {
			console.error("[Portal] Profile lookup error:", profileError);
			return NextResponse.json(
				{ error: "Failed to look up billing account" },
				{ status: 500 },
			);
		}

		if (!profile?.stripe_customer_id) {
			return NextResponse.json(
				{
					error: "No billing account found. Please subscribe first.",
				},
				{ status: 400 },
			);
		}

		// 3. Determine return URL safely
		const returnUrl =
			process.env.APP_URL ||
			req.headers.get("origin") ||
			"http://localhost:3000";

		// 4. Create Stripe Billing Portal session
		const stripe = getStripeClient();
		const portalSession = await stripe.billingPortal.sessions.create({
			customer: profile.stripe_customer_id,
			return_url: `${returnUrl}/dashboard/credits`,
		});

		console.log("[Portal] Session created:", {
			userId: user.id,
			portalUrl: portalSession.url ? "OK" : "MISSING",
		});

		return NextResponse.json({ url: portalSession.url });
	} catch (error) {
		console.error("[Portal] Error:", error);

		if (error instanceof Error && "type" in error) {
			return NextResponse.json(
				{ error: "Billing service error" },
				{ status: 502 },
			);
		}

		return NextResponse.json(
			{ error: "Failed to create billing portal session" },
			{ status: 500 },
		);
	}
}
