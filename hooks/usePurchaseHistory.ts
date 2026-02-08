"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";
import { supabaseBrowser } from "@/lib/supabase/browser";

export interface CreditPurchase {
	id: string;
	pack_id: string;
	credits_amount: number;
	amount_paid_cents: number;
	currency: string;
	status: "pending" | "succeeded" | "failed" | "refunded";
	created_at: string;
}

interface UsePurchaseHistoryReturn {
	purchases: CreditPurchase[];
	isLoading: boolean;
	error: string | null;
	refetch: () => Promise<void>;
}

const MAX_PURCHASES = 20;

/**
 * Hook to fetch purchase history from credit_purchases table.
 * Uses standard fetch pattern (no Realtime subscription).
 * Call refetch() after purchase success to update the list.
 */
export function usePurchaseHistory(): UsePurchaseHistoryReturn {
	const { isAuthenticated, isLoading: authLoading, user } = useAuth();
	const [purchases, setPurchases] = useState<CreditPurchase[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchPurchases = useCallback(async () => {
		if (!isAuthenticated || !user?.id) {
			setPurchases([]);
			setIsLoading(false);
			return;
		}

		try {
			setError(null);
			const supabase = supabaseBrowser();

			const { data, error: fetchError } = await supabase
				.from("credit_purchases")
				.select(
					"id, pack_id, credits_amount, amount_paid_cents, currency, status, created_at",
				)
				.eq("user_id", user.id)
				.order("created_at", { ascending: false })
				.limit(MAX_PURCHASES);

			if (fetchError) {
				// Table might not exist yet if migration hasn't run
				// Check for various error indicators of missing table/relation
				const errorCode = fetchError.code;
				const errorMessage = fetchError.message?.toLowerCase() || "";

				if (
					errorCode === "42P01" ||
					errorCode === "PGRST204" ||
					errorMessage.includes("relation") ||
					errorMessage.includes("does not exist") ||
					errorMessage.includes("credit_purchases")
				) {
					// Silently handle - table doesn't exist yet
					// This is expected before running the migration
					setPurchases([]);
					setIsLoading(false);
					return;
				}
				throw fetchError;
			}

			setPurchases(data || []);
		} catch (err) {
			// Only log actual errors, not missing table errors
			const errorMessage =
				err instanceof Error ? err.message : String(err);
			if (
				!errorMessage.includes("credit_purchases") &&
				!errorMessage.includes("relation")
			) {
				console.error("Failed to fetch purchase history:", err);
				setError("Failed to load purchases");
			} else {
				// Table not found - silently handle
				setPurchases([]);
			}
		} finally {
			setIsLoading(false);
		}
	}, [isAuthenticated, user?.id]);

	// Initial fetch when auth is ready
	useEffect(() => {
		if (!authLoading) {
			fetchPurchases();
		}
	}, [authLoading, fetchPurchases]);

	return {
		purchases,
		isLoading: authLoading || isLoading,
		error,
		refetch: fetchPurchases,
	};
}

/**
 * Pack display labels for UI.
 */
export const PACK_LABELS: Record<string, string> = {
	pro_75: "Pro Pack",
};

/**
 * Format cents to currency display.
 */
export function formatPrice(cents: number, currency: string): string {
	const amount = cents / 100;
	const currencyUpper = currency.toUpperCase();
	return `${currencyUpper} $${amount.toFixed(2)}`;
}
