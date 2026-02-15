/**
 * POST /api/stripe/checkout
 *
 * Creates a Stripe Checkout Session for purchasing credit packs.
 *
 * Security:
 * - Requires authentication
 * - Client only sends packId; server validates and maps to Stripe Price ID
 * - Credits amount is server-authoritative, never from client
 */

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getStripeClient } from "@/lib/stripe/client";
import { getPackById } from "@/lib/stripe/config";

export async function POST(req: Request) {
	try {
		// 1. Verify authentication
		const supabase = await createSupabaseServerClient();
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();

		if (authError || !user) {
			console.error("[Checkout] Auth failed:", authError?.message);
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 },
			);
		}

		// 2. Parse and validate request body
		const body = await req.json();
		const { packId } = body;

		if (!packId || typeof packId !== "string") {
			return NextResponse.json(
				{ error: "packId is required" },
				{ status: 400 },
			);
		}

		// 3. Validate packId against server config
		const pack = getPackById(packId);
		if (!pack) {
			console.error("[Checkout] Invalid packId:", packId);
			return NextResponse.json(
				{ error: "Invalid pack selected" },
				{ status: 400 },
			);
		}

		// 4. Validate Stripe Price ID is configured
		if (!pack.stripePriceId) {
			console.error(
				"[Checkout] Stripe Price ID not configured for pack:",
				packId,
			);
			return NextResponse.json(
				{ error: "Payment configuration error" },
				{ status: 500 },
			);
		}

		// 5. Determine base URL for redirects
		const appUrl = process.env.APP_URL || "http://localhost:3000";
		const successUrl = `${appUrl}/dashboard/credits?purchase=success&session_id={CHECKOUT_SESSION_ID}`;
		const cancelUrl = `${appUrl}/dashboard/credits?purchase=cancel`;

		// 6. Create Stripe Checkout Session
		const stripe = getStripeClient();
		const session = await stripe.checkout.sessions.create({
			mode: "subscription",
			payment_method_types: ["card"],
			line_items: [
				{
					price: pack.stripePriceId,
					quantity: 1,
				},
			],
			success_url: successUrl,
			cancel_url: cancelUrl,
			// Enable promotion code input
			allow_promotion_codes: true,
			// Collect billing address for tax calculation
			billing_address_collection: "auto",
			// Enable automatic tax (requires Stripe Tax setup)
			// automatic_tax: { enabled: true },
			metadata: {
				user_id: user.id,
				pack_id: pack.packId,
				environment: process.env.NODE_ENV || "development",
			},
			subscription_data: {
				metadata: {
					user_id: user.id,
					pack_id: pack.packId,
				},
			},
			// Pre-fill customer email if available
			customer_email: user.email || undefined,
		});

		console.log("[Checkout] Session created:", {
			sessionId: session.id,
			userId: user.id,
			packId: pack.packId,
		});

		// 7. Return checkout URL
		if (!session.url) {
			console.error("[Checkout] No URL in session response");
			return NextResponse.json(
				{ error: "Failed to create checkout session" },
				{ status: 500 },
			);
		}

		return NextResponse.json({ url: session.url });
	} catch (error) {
		console.error("[Checkout] Error:", error);

		// Handle Stripe-specific errors
		if (error instanceof Error && "type" in error) {
			return NextResponse.json(
				{ error: "Payment service error" },
				{ status: 502 },
			);
		}

		return NextResponse.json(
			{ error: "Failed to create checkout session" },
			{ status: 500 },
		);
	}
}
