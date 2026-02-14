"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";
import { supabaseBrowser } from "@/lib/supabase/browser";

/**
 * Subscription billing data from user_profiles.
 */
export interface BillingData {
	subscriptionStatus: string | null;
	planName: string;
	cancelAtPeriodEnd: boolean;
	cancelAt: string | null;
	currentPeriodEnd: string | null;
	hasStripeCustomer: boolean;
}

interface UseBillingReturn {
	billing: BillingData | null;
	isLoading: boolean;
	error: string | null;
	/** True if subscription columns don't exist yet (migration not applied) */
	migrationRequired: boolean;
	/** Computed helpers */
	hasSubscription: boolean;
	isActive: boolean;
	isCanceling: boolean;
	isPastDue: boolean;
	isCanceled: boolean;
	refetch: () => Promise<void>;
}

/**
 * Hook to fetch subscription/billing data from user_profiles.
 * Powers the Billing & Subscription card on the credits page.
 */
export function useBilling(): UseBillingReturn {
	const { isAuthenticated, isLoading: authLoading, user } = useAuth();
	const [billing, setBilling] = useState<BillingData | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [migrationRequired, setMigrationRequired] = useState(false);

	const fetchBilling = useCallback(async () => {
		if (!isAuthenticated || !user?.id) {
			setBilling(null);
			setIsLoading(false);
			return;
		}

		try {
			setError(null);
			const supabase = supabaseBrowser();

			const { data, error: fetchError } = await supabase
				.from("user_profiles")
				.select(
					"stripe_customer_id, subscription_status, plan_name, cancel_at_period_end, cancel_at, current_period_end",
				)
				.eq("id", user.id)
				.single();

			if (fetchError) {
				const errorMessage = fetchError.message?.toLowerCase() || "";
				const errorCode = fetchError.code;

				// Check if this is a missing-column error (migration not applied)
				if (
					errorCode === "42703" || // undefined_column
					errorMessage.includes("column") ||
					errorMessage.includes("does not exist")
				) {
					console.error(
						"[useBilling] Migration 011_subscription_fields.sql may not be applied. Subscription columns not found.",
					);
					setMigrationRequired(true);
					setBilling(null);
					setIsLoading(false);
					return;
				}

				throw fetchError;
			}

			setBilling({
				subscriptionStatus: data?.subscription_status ?? null,
				planName: data?.plan_name ?? "free",
				cancelAtPeriodEnd: data?.cancel_at_period_end ?? false,
				cancelAt: data?.cancel_at ?? null,
				currentPeriodEnd: data?.current_period_end ?? null,
				hasStripeCustomer: !!data?.stripe_customer_id,
			});
		} catch (err) {
			console.error("[useBilling] Failed to fetch billing data:", err);
			setError("Failed to load billing information");
		} finally {
			setIsLoading(false);
		}
	}, [isAuthenticated, user?.id]);

	// Initial fetch
	useEffect(() => {
		if (!authLoading) {
			fetchBilling();
		}
	}, [authLoading, fetchBilling]);

	// Computed helpers
	const hasSubscription =
		billing?.subscriptionStatus != null &&
		billing.subscriptionStatus !== "canceled" &&
		billing.planName !== "free";

	const isActive =
		billing?.subscriptionStatus === "active" &&
		!billing.cancelAtPeriodEnd &&
		billing.cancelAt == null;

	const isCanceling =
		billing?.subscriptionStatus === "active" &&
		(billing.cancelAtPeriodEnd === true || billing.cancelAt != null);

	const isPastDue = billing?.subscriptionStatus === "past_due";

	const isCanceled =
		billing?.subscriptionStatus === "canceled" ||
		(!billing?.subscriptionStatus && billing?.planName === "free");

	return {
		billing,
		isLoading: authLoading || isLoading,
		error,
		migrationRequired,
		hasSubscription,
		isActive,
		isCanceling,
		isPastDue,
		isCanceled,
		refetch: fetchBilling,
	};
}
