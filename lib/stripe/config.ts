/**
 * Stripe Credit Packs Configuration
 *
 * Server-authoritative configuration for credit packs.
 * Client only sends packId; server validates and maps to actual
 * Stripe Price ID and credit amount.
 *
 * SECURITY: Credits are NEVER derived from webhook metadata —
 * always from this server config after validating the Stripe Price ID.
 */

export type CreditPackId = "pro_75";

export interface CreditPack {
	packId: CreditPackId;
	label: string;
	description: string;
	credits: number;
	priceCents: number;
	currency: "cad";
	stripePriceId: string;
}

/**
 * All available credit packs.
 * Add new packs here as needed.
 */
export const CREDIT_PACKS: Record<CreditPackId, CreditPack> = {
	pro_75: {
		packId: "pro_75",
		label: "Pro Pack",
		description: "50 credits for resume generation",
		credits: 50,
		priceCents: 1000, // CAD $10.00
		currency: "cad",
		stripePriceId: process.env.STRIPE_PRICE_PRO_75 || "",
	},
};

/**
 * Get pack configuration by packId.
 * Returns undefined if packId is invalid.
 */
export function getPackById(packId: string): CreditPack | undefined {
	return CREDIT_PACKS[packId as CreditPackId];
}

/**
 * Reverse lookup: Stripe Price ID -> Pack config.
 * Used by webhook to validate the price and derive credits amount.
 */
export function getPackByPriceId(priceId: string): CreditPack | undefined {
	return Object.values(CREDIT_PACKS).find((p) => p.stripePriceId === priceId);
}

/**
 * Get all packs for display (client-safe data only).
 * Excludes stripePriceId as it's server-only.
 */
export function getDisplayPacks() {
	return Object.values(CREDIT_PACKS).map(
		({ packId, label, description, credits, priceCents, currency }) => ({
			packId,
			label,
			description,
			credits,
			priceCents,
			currency,
		}),
	);
}
