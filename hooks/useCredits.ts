"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "./useAuth";
import { supabaseBrowser } from "@/lib/supabase/browser";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface UseCreditsReturn {
	credits: number | null;
	isLoading: boolean;
	error: string | null;
	refetch: () => Promise<void>;
}

/**
 * Hook that subscribes to Supabase Realtime for instant credit updates.
 * When credits change in the database, the UI updates immediately without refresh.
 */
export function useCredits(): UseCreditsReturn {
	const { isAuthenticated, isLoading: authLoading, user } = useAuth();
	const [credits, setCredits] = useState<number | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const channelRef = useRef<RealtimeChannel | null>(null);

	// Fetch credits from API (initial load and manual refetch)
	const fetchCredits = useCallback(async () => {
		if (!isAuthenticated) {
			setCredits(null);
			setIsLoading(false);
			return;
		}

		try {
			setIsLoading(true);
			setError(null);
			const res = await fetch("/api/credits");
			if (!res.ok) {
				throw new Error("Failed to fetch credits");
			}
			const data = await res.json();
			setCredits(data.credits);
		} catch (err) {
			console.error("Failed to fetch credits:", err);
			setError(err instanceof Error ? err.message : "Unknown error");
			setCredits(null);
		} finally {
			setIsLoading(false);
		}
	}, [isAuthenticated]);

	// Initial fetch when auth is ready
	useEffect(() => {
		if (!authLoading) {
			fetchCredits();
		}
	}, [authLoading, fetchCredits]);

	// Subscribe to Realtime updates on user_profiles table
	useEffect(() => {
		// Only subscribe if authenticated and we have a user ID
		if (!isAuthenticated || !user?.id) {
			return;
		}

		const supabase = supabaseBrowser();

		// Create a channel for this user's profile
		const channel = supabase
			.channel(`credits:${user.id}`)
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
					// Non-critical: credits still work via API, just no live updates
					console.warn(
						"[useCredits] Realtime unavailable - live updates disabled",
					);
				}
			});

		channelRef.current = channel;

		// Cleanup on unmount or when user changes
		return () => {
			if (channelRef.current) {
				console.log("[useCredits] Unsubscribing from Realtime channel");
				supabase.removeChannel(channelRef.current);
				channelRef.current = null;
			}
		};
	}, [isAuthenticated, user?.id]);

	return {
		credits,
		isLoading: authLoading || isLoading,
		error,
		refetch: fetchCredits,
	};
}
