/**
 * Stripe Client
 *
 * Server-side only Stripe SDK initialization.
 * Uses lazy initialization to avoid build-time errors when env vars are not set.
 */

import Stripe from "stripe";

let stripeClient: Stripe | null = null;

/**
 * Get the Stripe client instance.
 * Lazily initialized to avoid build-time errors.
 *
 * @throws Error if STRIPE_SECRET_KEY is not configured
 */
export function getStripeClient(): Stripe {
	if (stripeClient) {
		return stripeClient;
	}

	const secretKey = process.env.STRIPE_SECRET_KEY;
	if (!secretKey) {
		throw new Error(
			"STRIPE_SECRET_KEY is not configured. Please set it in your environment variables.",
		);
	}

	stripeClient = new Stripe(secretKey, {
		// Let Stripe SDK use its default API version
		typescript: true,
	});

	return stripeClient;
}

/**
 * Alias for backward compatibility.
 * @deprecated Use getStripeClient() instead
 */
export const stripe = {
	get checkout() {
		return getStripeClient().checkout;
	},
	get webhooks() {
		return getStripeClient().webhooks;
	},
};
