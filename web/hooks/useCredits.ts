"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "./useAuth";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { useCreditsContext } from "@/providers/CreditsProvider";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface UseCreditsReturn {
	credits: number | null;
	isLoading: boolean;
	error: string | null;
	refetch: () => Promise<void>;
}

/**
 * Hook that returns the user's credit balance with Realtime updates.
 *
 * Inside a <CreditsProvider> (dashboard layout) → uses shared context,
 * one Realtime channel for all consumers, always in sync.
 *
 * Outside a provider (landing page) → creates its own subscription.
 *
 * All hooks are called unconditionally to satisfy React's rules of hooks;
 * side effects are simply skipped when context is available.
 */
export function useCredits(): UseCreditsReturn {
	const ctx = useCreditsContext();
	const hasProvider = ctx !== null;

	const { isAuthenticated, isLoading: authLoading, user } = useAuth();
	const [credits, setCredits] = useState<number | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const channelRef = useRef<RealtimeChannel | null>(null);

	// Fetch credits from API (skipped when provider exists)
	const fetchCredits = useCallback(async () => {
		if (hasProvider) return;
		if (!isAuthenticated) {
			setCredits(null);
			setIsLoading(false);
			return;
		}

		try {
			setIsLoading(true);
			setError(null);
			const res = await fetch("/api/credits");
			if (!res.ok) throw new Error("Failed to fetch credits");
			const data = await res.json();
			setCredits(data.credits);
		} catch (err) {
			console.error("Failed to fetch credits:", err);
			setError(err instanceof Error ? err.message : "Unknown error");
			setCredits(null);
		} finally {
			setIsLoading(false);
		}
	}, [isAuthenticated, hasProvider]);

	// Initial fetch (skipped when provider exists)
	useEffect(() => {
		if (hasProvider) return;
		if (!authLoading) {
			fetchCredits();
		}
	}, [authLoading, fetchCredits, hasProvider]);

	// Realtime subscription (skipped when provider exists)
	useEffect(() => {
		if (hasProvider) return;
		if (!isAuthenticated || !user?.id) return;

		const supabase = supabaseBrowser();

		const channel = supabase
			.channel(`credits-standalone:${user.id}`)
			.on(
				"postgres_changes",
				{
					event: "UPDATE",
					schema: "public",
					table: "user_profiles",
					filter: `id=eq.${user.id}`,
				},
				(payload) => {
					const newCredits = (payload.new as { credits: number })
						.credits;
					console.log(
						"[useCredits] Realtime update - credits:",
						newCredits,
					);
					setCredits(newCredits);
				},
			)
			.subscribe((status) => {
				if (status === "SUBSCRIBED") {
					console.log("[useCredits] Realtime channel subscribed");
				} else if (status === "CHANNEL_ERROR") {
					console.warn(
						"[useCredits] Realtime unavailable - live updates disabled",
					);
				}
			});

		channelRef.current = channel;

		return () => {
			if (channelRef.current) {
				console.log("[useCredits] Unsubscribing from Realtime channel");
				supabase.removeChannel(channelRef.current);
				channelRef.current = null;
			}
		};
	}, [isAuthenticated, user?.id, hasProvider]);

	// If context exists, return shared state
	if (ctx) {
		return ctx;
	}

	// Otherwise return local state
	return {
		credits,
		isLoading: authLoading || isLoading,
		error,
		refetch: fetchCredits,
	};
}
