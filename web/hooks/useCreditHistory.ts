"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "./useAuth";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { deriveJobLabel } from "./useGenerations";
import type { RealtimeChannel } from "@supabase/supabase-js";

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

const MAX_EVENTS = 10;

/**
 * Hook to fetch credit history derived from generation jobs.
 * Since there's no dedicated ledger table, we infer history from succeeded generations.
 * Includes Supabase Realtime subscription for instant updates.
 */
export function useCreditHistory(): UseCreditHistoryReturn {
	const { isAuthenticated, isLoading: authLoading, user } = useAuth();
	const [events, setEvents] = useState<CreditEvent[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [usageThisMonth, setUsageThisMonth] = useState(0);

	const channelRef = useRef<RealtimeChannel | null>(null);

	// Transform a job row to a credit event
	const jobToCreditEvent = useCallback(
		(job: {
			id: string;
			jd_text: string | null;
			completed_at: string | null;
		}): CreditEvent => ({
			id: job.id,
			event_type: "generation" as const,
			amount: -1,
			created_at: job.completed_at || new Date().toISOString(),
			job_id: job.id,
			job_label: deriveJobLabel(job.jd_text),
		}),
		[],
	);

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
				.limit(MAX_EVENTS);

			if (fetchError) throw fetchError;

			// Transform to credit events
			const creditEvents: CreditEvent[] = (data || []).map(
				jobToCreditEvent,
			);
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
	}, [isAuthenticated, user?.id, jobToCreditEvent]);

	// Initial fetch when auth is ready
	useEffect(() => {
		if (!authLoading) {
			fetchHistory();
		}
	}, [authLoading, fetchHistory]);

	// Subscribe to Realtime updates on generation_jobs table
	useEffect(() => {
		if (!isAuthenticated || !user?.id) {
			return;
		}

		const supabase = supabaseBrowser();

		// Create a channel for credit history updates
		const channel = supabase
			.channel(`credit_history:${user.id}`)
			.on(
				"postgres_changes",
				{
					event: "UPDATE",
					schema: "public",
					table: "generation_jobs",
					filter: `user_id=eq.${user.id}`,
				},
				(payload) => {
					const newJob = payload.new as {
						id: string;
						status: string;
						jd_text: string | null;
						completed_at: string | null;
						user_id: string;
					};

					// Only care about jobs that just succeeded
					if (newJob.status === "succeeded") {
						console.log(
							"[useCreditHistory] Job succeeded, updating history:",
							newJob.id,
						);

						const newEvent = jobToCreditEvent(newJob);

						setEvents((prev) => {
							// Check if this event already exists
							const exists = prev.some(
								(e) => e.id === newEvent.id,
							);
							if (exists) return prev;

							// Add to front and trim to MAX_EVENTS
							return [newEvent, ...prev].slice(0, MAX_EVENTS);
						});

						// Increment usage this month
						setUsageThisMonth((prev) => prev + 1);
					}
				},
			)
			.subscribe((status) => {
				if (status === "SUBSCRIBED") {
					console.log(
						"[useCreditHistory] Realtime channel subscribed",
					);
				} else if (status === "CHANNEL_ERROR") {
					console.warn(
						"[useCreditHistory] Realtime unavailable - live updates disabled",
					);
				}
			});

		channelRef.current = channel;

		// Cleanup on unmount or when user changes
		return () => {
			if (channelRef.current) {
				console.log(
					"[useCreditHistory] Unsubscribing from Realtime channel",
				);
				supabase.removeChannel(channelRef.current);
				channelRef.current = null;
			}
		};
	}, [isAuthenticated, user?.id, jobToCreditEvent]);

	return {
		events,
		isLoading: authLoading || isLoading,
		error,
		usageThisMonth,
		refetch: fetchHistory,
	};
}
