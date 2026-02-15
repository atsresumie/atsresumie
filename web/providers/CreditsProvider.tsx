"use client";

import {
	createContext,
	useContext,
	useState,
	useEffect,
	useCallback,
	useRef,
	type ReactNode,
} from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabaseBrowser } from "@/lib/supabase/browser";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface CreditsContextValue {
	credits: number | null;
	isLoading: boolean;
	error: string | null;
	refetch: () => Promise<void>;
}

const CreditsContext = createContext<CreditsContextValue | null>(null);

/**
 * CreditsProvider — wraps a subtree so every `useCredits()` consumer
 * shares the SAME state and a SINGLE Realtime channel.
 *
 * Place this in the dashboard layout (or app layout) to keep the
 * navbar, sidebar, credits page, etc. all in sync.
 */
export function CreditsProvider({ children }: { children: ReactNode }) {
	const { isAuthenticated, isLoading: authLoading, user } = useAuth();
	const [credits, setCredits] = useState<number | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const channelRef = useRef<RealtimeChannel | null>(null);

	// Fetch credits from API
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

	// Initial fetch
	useEffect(() => {
		if (!authLoading) {
			fetchCredits();
		}
	}, [authLoading, fetchCredits]);

	// Single Realtime subscription for the entire subtree
	useEffect(() => {
		if (!isAuthenticated || !user?.id) {
			return;
		}

		const supabase = supabaseBrowser();

		const channel = supabase
			.channel(`credits-global:${user.id}`)
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
						"[CreditsProvider] Realtime update — credits:",
						newCredits,
					);
					setCredits(newCredits);
				},
			)
			.subscribe((status) => {
				if (status === "SUBSCRIBED") {
					console.log(
						"[CreditsProvider] Realtime channel subscribed",
					);
				} else if (status === "CHANNEL_ERROR") {
					console.warn(
						"[CreditsProvider] Realtime unavailable — live updates disabled",
					);
				}
			});

		channelRef.current = channel;

		return () => {
			if (channelRef.current) {
				console.log(
					"[CreditsProvider] Unsubscribing from Realtime channel",
				);
				supabase.removeChannel(channelRef.current);
				channelRef.current = null;
			}
		};
	}, [isAuthenticated, user?.id]);

	return (
		<CreditsContext.Provider
			value={{
				credits,
				isLoading: authLoading || isLoading,
				error,
				refetch: fetchCredits,
			}}
		>
			{children}
		</CreditsContext.Provider>
	);
}

/**
 * Read from the nearest CreditsProvider.
 * Falls back to null if called outside a provider (components outside
 * the dashboard shell that still call useCredits will create their own
 * subscription via the hook below).
 */
export function useCreditsContext(): CreditsContextValue | null {
	return useContext(CreditsContext);
}
