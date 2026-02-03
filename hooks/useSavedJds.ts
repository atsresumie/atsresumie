"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "./useAuth";
import { supabaseBrowser } from "@/lib/supabase/browser";
import type { RealtimeChannel } from "@supabase/supabase-js";

/**
 * Saved Job Description record from database
 */
export interface SavedJobDescription {
	id: string;
	user_id: string;
	label: string;
	company: string | null;
	source_url: string | null;
	jd_text: string;
	created_at: string;
	updated_at: string;
}

/**
 * Input for creating a new saved JD
 */
export interface CreateSavedJdInput {
	label: string;
	company?: string;
	source_url?: string;
	jd_text: string;
}

/**
 * Input for updating a saved JD
 */
export interface UpdateSavedJdInput {
	id: string;
	label?: string;
	company?: string | null;
	source_url?: string | null;
	jd_text?: string;
}

interface UseSavedJdsReturn {
	savedJds: SavedJobDescription[];
	isLoading: boolean;
	error: string | null;
	refetch: () => Promise<void>;
	createSavedJd: (
		input: CreateSavedJdInput,
	) => Promise<SavedJobDescription | null>;
	updateSavedJd: (input: UpdateSavedJdInput) => Promise<boolean>;
	deleteSavedJd: (id: string) => Promise<boolean>;
	isMutating: boolean;
}

const MAX_SAVED_JDS = 100;

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
 * Hook to manage saved job descriptions with CRUD and Realtime support.
 */
export function useSavedJds(): UseSavedJdsReturn {
	const { isAuthenticated, isLoading: authLoading, user } = useAuth();
	const [savedJds, setSavedJds] = useState<SavedJobDescription[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isMutating, setIsMutating] = useState(false);

	const channelRef = useRef<RealtimeChannel | null>(null);

	// Fetch saved JDs
	const fetchSavedJds = useCallback(async () => {
		if (!isAuthenticated || !user?.id) {
			setSavedJds([]);
			setIsLoading(false);
			return;
		}

		try {
			setError(null);
			const supabase = supabaseBrowser();

			const { data, error: fetchError } = await supabase
				.from("saved_job_descriptions")
				.select("*")
				.eq("user_id", user.id)
				.order("updated_at", { ascending: false })
				.limit(MAX_SAVED_JDS);

			if (fetchError) {
				throw fetchError;
			}

			setSavedJds((data as SavedJobDescription[]) || []);
		} catch (err) {
			console.error("Failed to fetch saved JDs:", err);
			setError(
				err instanceof Error ? err.message : "Failed to load saved JDs",
			);
		} finally {
			setIsLoading(false);
		}
	}, [isAuthenticated, user?.id]);

	// Create a new saved JD
	const createSavedJd = useCallback(
		async (
			input: CreateSavedJdInput,
		): Promise<SavedJobDescription | null> => {
			if (!isAuthenticated || !user?.id) {
				return null;
			}

			setIsMutating(true);
			try {
				const supabase = supabaseBrowser();

				const { data, error: insertError } = await supabase
					.from("saved_job_descriptions")
					.insert({
						user_id: user.id,
						label: input.label,
						company: input.company || null,
						source_url: input.source_url || null,
						jd_text: input.jd_text,
					})
					.select()
					.single();

				if (insertError) {
					throw insertError;
				}

				const newJd = data as SavedJobDescription;

				// Optimistic update: prepend to list
				setSavedJds((prev) => [newJd, ...prev].slice(0, MAX_SAVED_JDS));

				return newJd;
			} catch (err) {
				console.error("Failed to create saved JD:", err);
				setError(
					err instanceof Error
						? err.message
						: "Failed to create saved JD",
				);
				return null;
			} finally {
				setIsMutating(false);
			}
		},
		[isAuthenticated, user?.id],
	);

	// Update a saved JD
	const updateSavedJd = useCallback(
		async (input: UpdateSavedJdInput): Promise<boolean> => {
			if (!isAuthenticated || !user?.id) {
				return false;
			}

			setIsMutating(true);
			try {
				const supabase = supabaseBrowser();

				// Build update object (only include non-undefined fields)
				const updateData: Record<string, unknown> = {};
				if (input.label !== undefined) updateData.label = input.label;
				if (input.company !== undefined)
					updateData.company = input.company;
				if (input.source_url !== undefined)
					updateData.source_url = input.source_url;
				if (input.jd_text !== undefined)
					updateData.jd_text = input.jd_text;

				const { data, error: updateError } = await supabase
					.from("saved_job_descriptions")
					.update(updateData)
					.eq("id", input.id)
					.eq("user_id", user.id)
					.select()
					.single();

				if (updateError) {
					throw updateError;
				}

				const updatedJd = data as SavedJobDescription;

				// Optimistic update: replace in list and move to top
				setSavedJds((prev) => {
					const filtered = prev.filter((jd) => jd.id !== input.id);
					return [updatedJd, ...filtered];
				});

				return true;
			} catch (err) {
				console.error("Failed to update saved JD:", err);
				setError(
					err instanceof Error
						? err.message
						: "Failed to update saved JD",
				);
				return false;
			} finally {
				setIsMutating(false);
			}
		},
		[isAuthenticated, user?.id],
	);

	// Delete a saved JD
	const deleteSavedJd = useCallback(
		async (id: string): Promise<boolean> => {
			if (!isAuthenticated || !user?.id) {
				return false;
			}

			setIsMutating(true);
			try {
				const supabase = supabaseBrowser();

				const { error: deleteError } = await supabase
					.from("saved_job_descriptions")
					.delete()
					.eq("id", id)
					.eq("user_id", user.id);

				if (deleteError) {
					throw deleteError;
				}

				// Optimistic update: remove from list
				setSavedJds((prev) => prev.filter((jd) => jd.id !== id));

				return true;
			} catch (err) {
				console.error("Failed to delete saved JD:", err);
				setError(
					err instanceof Error
						? err.message
						: "Failed to delete saved JD",
				);
				return false;
			} finally {
				setIsMutating(false);
			}
		},
		[isAuthenticated, user?.id],
	);

	// Initial fetch when auth is ready
	useEffect(() => {
		if (!authLoading) {
			fetchSavedJds();
		}
	}, [authLoading, fetchSavedJds]);

	// Subscribe to Realtime updates
	useEffect(() => {
		if (!isAuthenticated || !user?.id) {
			return;
		}

		const supabase = supabaseBrowser();

		const channel = supabase
			.channel(`saved_jds:${user.id}`)
			.on(
				"postgres_changes",
				{
					event: "INSERT",
					schema: "public",
					table: "saved_job_descriptions",
					filter: `user_id=eq.${user.id}`,
				},
				(payload) => {
					const newJd = payload.new as SavedJobDescription;
					console.log("[useSavedJds] New saved JD:", newJd.id);

					// Prepend if not already in list (avoid duplicates from optimistic update)
					setSavedJds((prev) => {
						if (prev.some((jd) => jd.id === newJd.id)) {
							return prev;
						}
						return [newJd, ...prev].slice(0, MAX_SAVED_JDS);
					});
				},
			)
			.on(
				"postgres_changes",
				{
					event: "UPDATE",
					schema: "public",
					table: "saved_job_descriptions",
					filter: `user_id=eq.${user.id}`,
				},
				(payload) => {
					const updatedJd = payload.new as SavedJobDescription;
					console.log(
						"[useSavedJds] Saved JD updated:",
						updatedJd.id,
					);

					// Update in list
					setSavedJds((prev) =>
						prev.map((jd) =>
							jd.id === updatedJd.id ? updatedJd : jd,
						),
					);
				},
			)
			.on(
				"postgres_changes",
				{
					event: "DELETE",
					schema: "public",
					table: "saved_job_descriptions",
					filter: `user_id=eq.${user.id}`,
				},
				(payload) => {
					const deletedId = (payload.old as { id: string }).id;
					console.log("[useSavedJds] Saved JD deleted:", deletedId);

					// Remove from list
					setSavedJds((prev) =>
						prev.filter((jd) => jd.id !== deletedId),
					);
				},
			)
			.subscribe((status) => {
				if (status === "SUBSCRIBED") {
					console.log("[useSavedJds] Realtime channel subscribed");
				} else if (status === "CHANNEL_ERROR") {
					console.warn(
						"[useSavedJds] Realtime unavailable - live updates disabled",
					);
				}
			});

		channelRef.current = channel;

		return () => {
			if (channelRef.current) {
				console.log("[useSavedJds] Unsubscribing from Realtime");
				supabase.removeChannel(channelRef.current);
				channelRef.current = null;
			}
		};
	}, [isAuthenticated, user?.id]);

	return {
		savedJds,
		isLoading: authLoading || isLoading,
		error,
		refetch: fetchSavedJds,
		createSavedJd,
		updateSavedJd,
		deleteSavedJd,
		isMutating,
	};
}
