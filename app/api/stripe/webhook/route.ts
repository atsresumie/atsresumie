/**
 * POST /api/stripe/webhook
 *
 * Handles Stripe webhook events for credit purchases.
 *
 * Security:
 * - Verifies Stripe signature using raw body
 * - Validates price ID from line items (server-authoritative)
 * - Credits amount derived from server config, NOT metadata
 * - Idempotent via INSERT-as-gate pattern in RPC
 *
 * Events handled:
 * - checkout.session.completed: Grant credits
 * - charge.refunded: Mark purchase as refunded (record only)
 */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getStripeClient } from "@/lib/stripe/client";
import { getPackByPriceId } from "@/lib/stripe/config";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type Stripe from "stripe";

// Disable body parsing - we need raw body for signature verification
export const runtime = "nodejs";

/**
 * Read raw body from request for Stripe signature verification.
 * Must be called before any JSON parsing.
 */
async function getRawBody(req: Request): Promise<Buffer> {
	const chunks: Uint8Array[] = [];
	const reader = req.body?.getReader();

	if (!reader) {
		throw new Error("No request body");
	}

	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		if (value) chunks.push(value);
	}

	return Buffer.concat(chunks);
}

/**
 * Handle checkout.session.completed event.
 * Validates price, derives credits from server config, and grants credits idempotently.
 */
async function handleCheckoutCompleted(
	event: Stripe.Event,
	sessionData: Stripe.Checkout.Session,
): Promise<NextResponse> {
	const eventId = event.id;
	const sessionId = sessionData.id;

	console.log("[Webhook] Processing checkout.session.completed:", {
		eventId,
		sessionId,
	});

	// 1. Retrieve session with expanded line items
	const stripe = getStripeClient();
	const session = await stripe.checkout.sessions.retrieve(sessionId, {
		expand: ["line_items.data.price"],
	});

	// 2. Validate exactly 1 line item
	if (!session.line_items?.data || session.line_items.data.length !== 1) {
		console.error(
			"[Webhook] Invalid line items count:",
			session.line_items?.data?.length,
		);
		return NextResponse.json(
			{ error: "Invalid line items" },
			{ status: 400 },
		);
	}

	const lineItem = session.line_items.data[0];
	const priceId = lineItem.price?.id;

	// 3. Validate price ID matches our config (server-authoritative)
	if (!priceId) {
		console.error("[Webhook] No price ID in line item");
		return NextResponse.json(
			{ error: "Missing price ID" },
			{ status: 400 },
		);
	}

	const pack = getPackByPriceId(priceId);
	if (!pack) {
		console.error("[Webhook] Unknown price ID:", priceId);
		return NextResponse.json({ error: "Unknown price" }, { status: 400 });
	}

	// 4. Derive credits_amount from SERVER config (not metadata)
	const creditsAmount = pack.credits;

	// 5. Extract user_id from metadata
	const userId = session.metadata?.user_id;
	if (!userId) {
		console.error("[Webhook] Missing user_id in metadata");
		return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
	}

	// 6. Validate amount_total and currency are present
	if (session.amount_total == null || !session.currency) {
		console.error("[Webhook] Missing amount_total or currency", {
			amount_total: session.amount_total,
			currency: session.currency,
		});
		return NextResponse.json(
			{ error: "Missing payment details" },
			{ status: 400 },
		);
	}

	// 7. Grant credits idempotently via RPC
	const supabase = supabaseAdmin();
	const { data: granted, error: rpcError } = await supabase.rpc(
		"grant_credits_for_purchase",
		{
			p_user_id: userId,
			p_credits_amount: creditsAmount,
			p_stripe_checkout_session_id: session.id,
			p_stripe_event_id: eventId,
			p_stripe_payment_intent_id:
				(session.payment_intent as string) || null,
			p_pack_id: pack.packId,
			p_amount_paid_cents: session.amount_total,
			p_currency: session.currency,
		},
	);

	if (rpcError) {
		console.error("[Webhook] RPC error:", rpcError);
		return NextResponse.json({ error: "Database error" }, { status: 500 });
	}

	if (granted) {
		console.log("[Webhook] Credits granted:", {
			userId,
			credits: creditsAmount,
			sessionId,
			eventId,
		});
	} else {
		console.log("[Webhook] Already processed (idempotent):", {
			sessionId,
			eventId,
		});
	}

	return NextResponse.json({ received: true, granted });
}

/**
 * Handle charge.refunded event.
 * Records refund status but does NOT subtract credits (Phase 9 MVP policy).
 */
async function handleChargeRefunded(
	event: Stripe.Event,
	charge: Stripe.Charge,
): Promise<NextResponse> {
	const paymentIntentId = charge.payment_intent as string | null;

	console.log("[Webhook] Processing charge.refunded:", {
		eventId: event.id,
		chargeId: charge.id,
		paymentIntentId,
	});

	if (!paymentIntentId) {
		console.warn("[Webhook] No payment_intent in refund event");
		return NextResponse.json({ received: true, updated: false });
	}

	// Mark purchase as refunded (does NOT subtract credits in Phase 9)
	const supabase = supabaseAdmin();
	const { data: updated, error: rpcError } = await supabase.rpc(
		"mark_purchase_refunded",
		{ p_stripe_payment_intent_id: paymentIntentId },
	);

	if (rpcError) {
		console.error("[Webhook] Refund RPC error:", rpcError);
		// Don't fail the webhook - refund recording is best-effort
	}

	console.log("[Webhook] Refund recorded:", {
		paymentIntentId,
		updated,
	});

	return NextResponse.json({ received: true, updated });
}

export async function POST(req: Request) {
	try {
		// 1. Get webhook secret
		const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
		if (!webhookSecret) {
			console.error("[Webhook] STRIPE_WEBHOOK_SECRET not configured");
			return NextResponse.json(
				{ error: "Webhook not configured" },
				{ status: 500 },
			);
		}

		// 2. Get Stripe signature from headers
		const headersList = await headers();
		const signature = headersList.get("stripe-signature");
		if (!signature) {
			console.error("[Webhook] Missing stripe-signature header");
			return NextResponse.json(
				{ error: "Missing signature" },
				{ status: 400 },
			);
		}

		// 3. Get raw body for signature verification
		const rawBody = await getRawBody(req);

		// 4. Verify signature and construct event
		const stripe = getStripeClient();
		let event: Stripe.Event;
		try {
			event = stripe.webhooks.constructEvent(
				rawBody,
				signature,
				webhookSecret,
			);
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Unknown error";
			console.error("[Webhook] Signature verification failed:", message);
			return NextResponse.json(
				{ error: "Invalid signature" },
				{ status: 400 },
			);
		}

		console.log("[Webhook] Event received:", {
			type: event.type,
			id: event.id,
		});

		// 5. Route event to appropriate handler
		switch (event.type) {
			case "checkout.session.completed": {
				const session = event.data.object as Stripe.Checkout.Session;
				return handleCheckoutCompleted(event, session);
			}

			case "charge.refunded": {
				const charge = event.data.object as Stripe.Charge;
				return handleChargeRefunded(event, charge);
			}

			default:
				// Acknowledge unhandled events
				console.log("[Webhook] Unhandled event type:", event.type);
				return NextResponse.json({ received: true });
		}
	} catch (error) {
		console.error("[Webhook] Unexpected error:", error);
		return NextResponse.json(
			{ error: "Webhook processing failed" },
			{ status: 500 },
		);
	}
}
