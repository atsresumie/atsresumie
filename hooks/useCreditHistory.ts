"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { deriveJobLabel, getRelativeTime } from "./useGenerations";

export interface CreditEvent {
	id: string;
	event_type: "generation" | "signup" | "refund" | "bonus" | "purchase";
	amount: number;
	created_at: string;
	job_id: string | null;
	job_label: string | null;
}

interface UseCreditHistoryReturn {
	events: CreditEvent[];
	isLoading: boolean;
	error: string | null;
	usageThisMonth: number;
	refetch: () => Promise<void>;
}

/**
 * Hook to fetch credit history derived from generation jobs.
 * Since there's no dedicated ledger table, we infer history from succeeded generations.
 */
export function useCreditHistory(): UseCreditHistoryReturn {
	const { isAuthenticated, isLoading: authLoading, user } = useAuth();
	const [events, setEvents] = useState<CreditEvent[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [usageThisMonth, setUsageThisMonth] = useState(0);

	const fetchHistory = useCallback(async () => {
		if (!isAuthenticated || !user?.id) {
			setEvents([]);
			setIsLoading(false);
			return;
		}

		try {
			setError(null);
			const supabase = supabaseBrowser();

			// Get recent succeeded generations (last 10)
			const { data, error: fetchError } = await supabase
				.from("generation_jobs")
				.select("id, jd_text, completed_at, status")
				.eq("user_id", user.id)
				.eq("status", "succeeded")
				.order("completed_at", { ascending: false })
				.limit(10);

			if (fetchError) throw fetchError;

			// Transform to credit events
			const creditEvents: CreditEvent[] = (data || []).map((job) => ({
				id: job.id,
				event_type: "generation" as const,
				amount: -1, // Each generation costs 1 credit
				created_at: job.completed_at || new Date().toISOString(),
				job_id: job.id,
				job_label: deriveJobLabel(job.jd_text),
			}));

			setEvents(creditEvents);

			// Calculate usage this month
			const now = new Date();
			const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

			const { count, error: countError } = await supabase
				.from("generation_jobs")
				.select("*", { count: "exact", head: true })
				.eq("user_id", user.id)
				.eq("status", "succeeded")
				.gte("completed_at", startOfMonth.toISOString());

			if (!countError && count !== null) {
				setUsageThisMonth(count);
			}
		} catch (err) {
			console.error("Failed to fetch credit history:", err);
			setError(
				err instanceof Error ? err.message : "Failed to load history",
			);
		} finally {
			setIsLoading(false);
		}
	}, [isAuthenticated, user?.id]);

	// Initial fetch when auth is ready
	useEffect(() => {
		if (!authLoading) {
			fetchHistory();
		}
	}, [authLoading, fetchHistory]);

	return {
		events,
		isLoading: authLoading || isLoading,
		error,
		usageThisMonth,
		refetch: fetchHistory,
	};
}
