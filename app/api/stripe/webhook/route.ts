/**
 * POST /api/stripe/webhook
 *
 * Handles Stripe webhook events for credit purchases and subscription lifecycle.
 *
 * Security:
 * - Verifies Stripe signature using raw body
 * - Validates price ID from line items (server-authoritative)
 * - Credits amount derived from server config, NOT metadata
 * - Idempotent via INSERT-as-gate pattern in RPC
 * - User lookup by stripe_customer_id (primary) with metadata fallback
 *
 * Events handled:
 * - checkout.session.completed: Grant credits + store stripe_customer_id
 * - charge.refunded: Mark purchase as refunded (record only)
 * - customer.subscription.created: Set subscription fields
 * - customer.subscription.updated: Update subscription fields (incl. cancellation scheduling)
 * - customer.subscription.deleted: Clear subscription fields (if matching stored sub ID)
 * - invoice.paid: Mark active (with safety guards)
 * - invoice.payment_failed: Mark past_due
 */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getStripeClient } from "@/lib/stripe/client";
import { getPackByPriceId, getPlanNameByPriceId } from "@/lib/stripe/config";
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
 * Look up user_id by stripe_customer_id in user_profiles.
 * Returns null if not found.
 */
async function getUserIdByStripeCustomer(
	stripeCustomerId: string,
): Promise<string | null> {
	const supabase = supabaseAdmin();
	const { data, error } = await supabase
		.from("user_profiles")
		.select("id")
		.eq("stripe_customer_id", stripeCustomerId)
		.single();

	if (error || !data) {
		return null;
	}
	return data.id;
}

/**
 * Resolve user_id from a subscription event.
 * Primary: stripe_customer_id lookup in DB.
 * Fallback: subscription metadata user_id.
 */
async function resolveUserId(
	customerId: string,
	metadata?: Stripe.Metadata | null,
): Promise<string | null> {
	// Primary: look up by stripe_customer_id
	const userId = await getUserIdByStripeCustomer(customerId);
	if (userId) return userId;

	// Fallback: check metadata
	if (metadata?.user_id) {
		console.log(
			"[Webhook] Resolved user via metadata fallback (customer not in DB yet)",
		);
		return metadata.user_id;
	}

	return null;
}

/**
 * Handle checkout.session.completed event.
 * Validates price, derives credits from server config, grants credits idempotently,
 * and stores stripe_customer_id for future webhook lookups.
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

	// 7. Store stripe_customer_id in user_profiles for future webhook lookups
	const stripeCustomerId = session.customer as string | null;
	if (stripeCustomerId) {
		const supabase = supabaseAdmin();
		const { error: customerError } = await supabase
			.from("user_profiles")
			.update({
				stripe_customer_id: stripeCustomerId,
				updated_at: new Date().toISOString(),
			})
			.eq("id", userId);

		if (customerError) {
			console.error(
				"[Webhook] Failed to store stripe_customer_id:",
				customerError,
			);
			// Continue - credit grant is more important
		} else {
			console.log("[Webhook] Stored stripe_customer_id:", {
				userId,
				stripeCustomerId,
			});
		}
	}

	// 8. Grant credits idempotently via RPC
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

/**
 * Handle customer.subscription.created / customer.subscription.updated.
 * Updates subscription fields in user_profiles.
 * Uses stripe_customer_id as primary lookup with metadata fallback.
 */
async function handleSubscriptionChange(
	event: Stripe.Event,
	subscription: Stripe.Subscription,
): Promise<NextResponse> {
	const customerId = subscription.customer as string;

	console.log(`[Webhook] Processing ${event.type}:`, {
		eventId: event.id,
		subscriptionId: subscription.id,
		customerId,
		status: subscription.status,
	});

	// Resolve user by customer ID (primary) or metadata (fallback)
	const userId = await resolveUserId(customerId, subscription.metadata);
	if (!userId) {
		console.error(
			"[Webhook] Could not resolve user for subscription event:",
			{
				customerId,
				subscriptionId: subscription.id,
			},
		);
		return NextResponse.json({ error: "User not found" }, { status: 400 });
	}

	// Derive plan name from the subscription's price ID (server-authoritative)
	const firstItem = subscription.items?.data?.[0];
	const priceId = firstItem?.price?.id;
	const planName = priceId ? getPlanNameByPriceId(priceId) : "free";

	// In Stripe SDK v20+, current_period_end is on SubscriptionItem, not Subscription
	const currentPeriodEnd = firstItem?.current_period_end ?? null;

	// Build update payload
	const updatePayload = {
		stripe_customer_id: customerId,
		stripe_subscription_id: subscription.id,
		subscription_status: subscription.status,
		plan_name: planName,
		cancel_at_period_end: subscription.cancel_at_period_end,
		cancel_at: subscription.cancel_at
			? new Date(subscription.cancel_at * 1000).toISOString()
			: null,
		current_period_end: currentPeriodEnd
			? new Date(currentPeriodEnd * 1000).toISOString()
			: null,
		updated_at: new Date().toISOString(),
	};

	console.log(
		"[Webhook] DB update payload:",
		JSON.stringify(updatePayload, null, 2),
	);

	// Update subscription fields
	const supabase = supabaseAdmin();
	const { error: updateError, data: updateData } = await supabase
		.from("user_profiles")
		.update(updatePayload)
		.eq("id", userId)
		.select("cancel_at_period_end, subscription_status");

	console.log("[Webhook] DB update result:", {
		error: updateError,
		data: updateData,
	});

	if (updateError) {
		console.error("[Webhook] Subscription update error:", updateError);
		return NextResponse.json({ error: "Database error" }, { status: 500 });
	}

	console.log(`[Webhook] Subscription ${event.type} processed:`, {
		userId,
		subscriptionId: subscription.id,
		status: subscription.status,
		planName,
		cancelAtPeriodEnd: subscription.cancel_at_period_end,
	});

	return NextResponse.json({ received: true });
}

/**
 * Handle customer.subscription.deleted.
 * Only clears subscription fields if the deleted subscription ID
 * matches the stored stripe_subscription_id (prevents stale deletions
 * from overwriting a newer subscription).
 */
async function handleSubscriptionDeleted(
	event: Stripe.Event,
	subscription: Stripe.Subscription,
): Promise<NextResponse> {
	const customerId = subscription.customer as string;

	console.log("[Webhook] Processing customer.subscription.deleted:", {
		eventId: event.id,
		subscriptionId: subscription.id,
		customerId,
	});

	// Resolve user by customer ID
	const userId = await resolveUserId(customerId, subscription.metadata);
	if (!userId) {
		console.error(
			"[Webhook] Could not resolve user for subscription.deleted:",
			{ customerId },
		);
		return NextResponse.json({ error: "User not found" }, { status: 400 });
	}

	// Safety: only clear if the deleted sub matches what's stored
	const supabase = supabaseAdmin();
	const { data: profile } = await supabase
		.from("user_profiles")
		.select("stripe_subscription_id")
		.eq("id", userId)
		.single();

	if (profile?.stripe_subscription_id !== subscription.id) {
		console.log(
			"[Webhook] Ignoring deletion of non-current subscription:",
			{
				deleted: subscription.id,
				stored: profile?.stripe_subscription_id,
			},
		);
		return NextResponse.json({ received: true, skipped: true });
	}

	// Clear all subscription fields
	const { error: updateError } = await supabase
		.from("user_profiles")
		.update({
			stripe_subscription_id: null,
			subscription_status: "canceled",
			plan_name: "free",
			cancel_at_period_end: false,
			cancel_at: null,
			current_period_end: null,
			updated_at: new Date().toISOString(),
		})
		.eq("id", userId);

	if (updateError) {
		console.error(
			"[Webhook] Subscription delete update error:",
			updateError,
		);
		return NextResponse.json({ error: "Database error" }, { status: 500 });
	}

	console.log("[Webhook] Subscription deleted, reset to free:", { userId });
	return NextResponse.json({ received: true });
}

/**
 * Handle invoice.paid event.
 * Sets subscription_status to 'active' — but only if:
 * 1. The invoice's subscription matches stored stripe_subscription_id
 * 2. Current status is not 'canceled' (prevents stale invoice reactivation)
 */
async function handleInvoicePaid(
	event: Stripe.Event,
	invoice: Stripe.Invoice,
): Promise<NextResponse> {
	const customerId = invoice.customer as string;
	// In Stripe SDK v20+, subscription ID is in parent.subscription_details
	const subDetails = invoice.parent?.subscription_details;
	const invoiceSubId =
		typeof subDetails?.subscription === "string"
			? subDetails.subscription
			: (subDetails?.subscription?.id ?? null);

	console.log("[Webhook] Processing invoice.paid:", {
		eventId: event.id,
		invoiceId: invoice.id,
		customerId,
		subscriptionId: invoiceSubId,
	});

	if (!invoiceSubId) {
		// One-off invoice, not subscription-related
		return NextResponse.json({ received: true });
	}

	const userId = await getUserIdByStripeCustomer(customerId);
	if (!userId) {
		console.warn("[Webhook] No user found for invoice.paid:", {
			customerId,
		});
		return NextResponse.json({ received: true });
	}

	// Safety check: only update if sub matches and status is not canceled
	const supabase = supabaseAdmin();
	const { data: profile } = await supabase
		.from("user_profiles")
		.select("stripe_subscription_id, subscription_status")
		.eq("id", userId)
		.single();

	if (!profile) {
		return NextResponse.json({ received: true });
	}

	if (profile.stripe_subscription_id !== invoiceSubId) {
		console.log("[Webhook] invoice.paid for non-current subscription:", {
			invoiceSub: invoiceSubId,
			storedSub: profile.stripe_subscription_id,
		});
		return NextResponse.json({ received: true, skipped: true });
	}

	if (profile.subscription_status === "canceled") {
		console.log(
			"[Webhook] Ignoring invoice.paid for canceled subscription:",
			{ userId },
		);
		return NextResponse.json({ received: true, skipped: true });
	}

	const { error: updateError } = await supabase
		.from("user_profiles")
		.update({
			subscription_status: "active",
			updated_at: new Date().toISOString(),
		})
		.eq("id", userId);

	if (updateError) {
		console.error("[Webhook] invoice.paid update error:", updateError);
	}

	console.log("[Webhook] Subscription marked active via invoice.paid:", {
		userId,
	});
	return NextResponse.json({ received: true });
}

/**
 * Handle invoice.payment_failed event.
 * Sets subscription_status to 'past_due'.
 */
async function handleInvoicePaymentFailed(
	event: Stripe.Event,
	invoice: Stripe.Invoice,
): Promise<NextResponse> {
	const customerId = invoice.customer as string;
	// In Stripe SDK v20+, subscription ID is in parent.subscription_details
	const subDetails = invoice.parent?.subscription_details;
	const invoiceSubId =
		typeof subDetails?.subscription === "string"
			? subDetails.subscription
			: (subDetails?.subscription?.id ?? null);

	console.log("[Webhook] Processing invoice.payment_failed:", {
		eventId: event.id,
		invoiceId: invoice.id,
		customerId,
	});

	if (!invoiceSubId) {
		return NextResponse.json({ received: true });
	}

	const userId = await getUserIdByStripeCustomer(customerId);
	if (!userId) {
		console.warn("[Webhook] No user found for invoice.payment_failed:", {
			customerId,
		});
		return NextResponse.json({ received: true });
	}

	const supabase = supabaseAdmin();
	const { error: updateError } = await supabase
		.from("user_profiles")
		.update({
			subscription_status: "past_due",
			updated_at: new Date().toISOString(),
		})
		.eq("id", userId)
		.eq("stripe_subscription_id", invoiceSubId);

	if (updateError) {
		console.error(
			"[Webhook] invoice.payment_failed update error:",
			updateError,
		);
	}

	console.log("[Webhook] Subscription marked past_due:", { userId });
	return NextResponse.json({ received: true });
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

			case "customer.subscription.created":
			case "customer.subscription.updated": {
				const subscription = event.data.object as Stripe.Subscription;
				return handleSubscriptionChange(event, subscription);
			}

			case "customer.subscription.deleted": {
				const subscription = event.data.object as Stripe.Subscription;
				return handleSubscriptionDeleted(event, subscription);
			}

			case "invoice.paid": {
				const invoice = event.data.object as Stripe.Invoice;
				return handleInvoicePaid(event, invoice);
			}

			case "invoice.payment_failed": {
				const invoice = event.data.object as Stripe.Invoice;
				return handleInvoicePaymentFailed(event, invoice);
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
