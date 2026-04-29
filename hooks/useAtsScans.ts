"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "./useAuth";
import { supabaseBrowser } from "@/lib/supabase/browser";
import type { RealtimeChannel } from "@supabase/supabase-js";

/**
 * ATS scan record from the ats_scans table.
 */
export interface AtsScan {
	id: string;
	user_id: string;
	resume_label: string;
	resume_source: string;
	resume_version_id: string | null;
	generation_job_id: string | null;
	jd_snippet: string | null;
	score: number;
	result_json: Record<string, unknown>;
	created_at: string;
}

interface UseAtsScansReturn {
	scans: AtsScan[];
	isLoading: boolean;
	error: string | null;
	refetch: () => Promise<void>;
}

const MAX_SCANS = 50;

/**
 * Returns relative time string (e.g., "2 hours ago")
 */
export function getRelativeTime(dateString: string): string {
	const date = new Date(dateString);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffMins = Math.floor(diffMs / 60000);
	const diffHours = Math.floor(diffMins / 60);
	const diffDays = Math.floor(diffHours / 24);

	if (diffMins < 1) return "Just now";
	if (diffMins < 60) return `${diffMins}m ago`;
	if (diffHours < 24) return `${diffHours}h ago`;
	if (diffDays < 7) return `${diffDays}d ago`;

	return date.toLocaleDateString();
}

/**
 * Hook to fetch and subscribe to ATS scan history for the current user.
 */
export function useAtsScans(): UseAtsScansReturn {
	const { isAuthenticated, isLoading: authLoading, user } = useAuth();
	const [scans, setScans] = useState<AtsScan[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const channelRef = useRef<RealtimeChannel | null>(null);

	// Fetch scans
	const fetchScans = useCallback(async () => {
		if (!isAuthenticated || !user?.id) {
			setScans([]);
			setIsLoading(false);
			return;
		}

		try {
			setError(null);
			const supabase = supabaseBrowser();

			const { data, error: fetchError } = await supabase
				.from("ats_scans")
				.select("*")
				.eq("user_id", user.id)
				.order("created_at", { ascending: false })
				.limit(MAX_SCANS);

			if (fetchError) {
				throw fetchError;
			}

			setScans((data as AtsScan[]) || []);
		} catch (err) {
			console.error("Failed to fetch ATS scans:", err);
			setError(
				err instanceof Error ? err.message : "Failed to load scan history",
			);
		} finally {
			setIsLoading(false);
		}
	}, [isAuthenticated, user?.id]);

	// Initial fetch when auth is ready
	useEffect(() => {
		if (!authLoading) {
			fetchScans();
		}
	}, [authLoading, fetchScans]);

	// Subscribe to Realtime updates
	useEffect(() => {
		if (!isAuthenticated || !user?.id) {
			return;
		}

		const supabase = supabaseBrowser();

		const channel = supabase
			.channel(`ats_scans:${user.id}`)
			.on(
				"postgres_changes",
				{
					event: "INSERT",
					schema: "public",
					table: "ats_scans",
					filter: `user_id=eq.${user.id}`,
				},
				(payload) => {
					const newScan = payload.new as AtsScan;
					console.log("[useAtsScans] New scan:", newScan.id);

					// Prepend new scan and trim to MAX_SCANS
					setScans((prev) => [newScan, ...prev].slice(0, MAX_SCANS));
				},
			)
			.on(
				"postgres_changes",
				{
					event: "DELETE",
					schema: "public",
					table: "ats_scans",
					filter: `user_id=eq.${user.id}`,
				},
				(payload) => {
					const deletedId = (payload.old as { id: string }).id;
					console.log("[useAtsScans] Scan deleted:", deletedId);

					setScans((prev) => prev.filter((s) => s.id !== deletedId));
				},
			)
			.subscribe((status) => {
				if (status === "SUBSCRIBED") {
					console.log("[useAtsScans] Realtime channel subscribed");
				} else if (status === "CHANNEL_ERROR") {
					console.warn(
						"[useAtsScans] Realtime unavailable - live updates disabled",
					);
				}
			});

		channelRef.current = channel;

		return () => {
			if (channelRef.current) {
				console.log("[useAtsScans] Unsubscribing from Realtime");
				supabase.removeChannel(channelRef.current);
				channelRef.current = null;
			}
		};
	}, [isAuthenticated, user?.id]);

	return {
		scans,
		isLoading: authLoading || isLoading,
		error,
		refetch: fetchScans,
	};
}
