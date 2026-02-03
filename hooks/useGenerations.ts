"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "./useAuth";
import { supabaseBrowser } from "@/lib/supabase/browser";
import type { RealtimeChannel } from "@supabase/supabase-js";

/**
 * DB-exact status values from generation_jobs table.
 * Migration 002 changed from pending/running to queued/processing.
 */
export type GenerationJobStatus =
	| "queued"
	| "processing"
	| "succeeded"
	| "failed";

/**
 * Maps DB status values to user-friendly labels.
 */
export const STATUS_LABELS: Record<GenerationJobStatus, string> = {
	queued: "Pending",
	processing: "Running",
	succeeded: "Succeeded",
	failed: "Failed",
};

export interface GenerationJobFull {
	id: string;
	status: GenerationJobStatus;
	jd_text: string | null;
	pdf_object_path: string | null;
	error_message: string | null;
	created_at: string;
	started_at: string | null;
	completed_at: string | null;
}

interface UseGenerationsReturn {
	jobs: GenerationJobFull[];
	isLoading: boolean;
	error: string | null;
	refetch: () => Promise<void>;
	deleteJob: (jobId: string) => Promise<boolean>;
	isDeleting: boolean;
}

const MAX_JOBS = 50;

/**
 * Derives a short label from jd_text for display purposes.
 * Uses first line, trimmed to 50 chars.
 */
export function deriveJobLabel(jdText: string | null): string {
	if (!jdText || jdText.trim().length === 0) {
		return "Untitled generation";
	}

	// Get first line
	const firstLine = jdText.split("\n")[0].trim();

	if (firstLine.length === 0) {
		return "Untitled generation";
	}

	// Trim to 50 chars
	if (firstLine.length <= 50) {
		return firstLine;
	}

	return firstLine.slice(0, 47) + "...";
}

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
 * Hook to fetch and subscribe to generation jobs for the current user.
 * Supports full list (up to 50), realtime updates, and delete.
 */
export function useGenerations(): UseGenerationsReturn {
	const { isAuthenticated, isLoading: authLoading, user } = useAuth();
	const [jobs, setJobs] = useState<GenerationJobFull[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	const channelRef = useRef<RealtimeChannel | null>(null);

	// Fetch jobs
	const fetchJobs = useCallback(async () => {
		if (!isAuthenticated || !user?.id) {
			setJobs([]);
			setIsLoading(false);
			return;
		}

		try {
			setError(null);
			const supabase = supabaseBrowser();

			const { data, error: fetchError } = await supabase
				.from("generation_jobs")
				.select(
					"id, status, jd_text, pdf_object_path, error_message, created_at, started_at, completed_at",
				)
				.eq("user_id", user.id)
				.order("created_at", { ascending: false })
				.limit(MAX_JOBS);

			if (fetchError) {
				throw fetchError;
			}

			setJobs((data as GenerationJobFull[]) || []);
		} catch (err) {
			console.error("Failed to fetch generations:", err);
			setError(
				err instanceof Error
					? err.message
					: "Failed to load generations",
			);
		} finally {
			setIsLoading(false);
		}
	}, [isAuthenticated, user?.id]);

	// Delete job via API (defense in depth - verifies ownership server-side)
	const deleteJob = useCallback(
		async (jobId: string): Promise<boolean> => {
			if (!isAuthenticated || !user?.id) {
				return false;
			}

			setIsDeleting(true);
			try {
				const res = await fetch(`/api/jobs/${jobId}`, {
					method: "DELETE",
				});

				if (!res.ok) {
					const data = await res.json();
					throw new Error(data.error || "Failed to delete job");
				}

				// Remove from local state immediately
				setJobs((prev) => prev.filter((job) => job.id !== jobId));
				return true;
			} catch (err) {
				console.error("Failed to delete job:", err);
				return false;
			} finally {
				setIsDeleting(false);
			}
		},
		[isAuthenticated, user?.id],
	);

	// Initial fetch when auth is ready
	useEffect(() => {
		if (!authLoading) {
			fetchJobs();
		}
	}, [authLoading, fetchJobs]);

	// Subscribe to Realtime updates
	useEffect(() => {
		if (!isAuthenticated || !user?.id) {
			return;
		}

		const supabase = supabaseBrowser();

		const channel = supabase
			.channel(`generations:${user.id}`)
			.on(
				"postgres_changes",
				{
					event: "INSERT",
					schema: "public",
					table: "generation_jobs",
					filter: `user_id=eq.${user.id}`,
				},
				(payload) => {
					const newJob = payload.new as GenerationJobFull;
					console.log("[useGenerations] New job:", newJob.id);

					// Prepend new job and trim to MAX_JOBS
					setJobs((prev) => [newJob, ...prev].slice(0, MAX_JOBS));
				},
			)
			.on(
				"postgres_changes",
				{
					event: "UPDATE",
					schema: "public",
					table: "generation_jobs",
					filter: `user_id=eq.${user.id}`,
				},
				(payload) => {
					const updatedJob = payload.new as GenerationJobFull;
					console.log(
						"[useGenerations] Job updated:",
						updatedJob.id,
						updatedJob.status,
					);

					// Update job if it exists in our list
					setJobs((prev) =>
						prev.map((job) =>
							job.id === updatedJob.id ? updatedJob : job,
						),
					);
				},
			)
			.on(
				"postgres_changes",
				{
					event: "DELETE",
					schema: "public",
					table: "generation_jobs",
					filter: `user_id=eq.${user.id}`,
				},
				(payload) => {
					const deletedId = (payload.old as { id: string }).id;
					console.log("[useGenerations] Job deleted:", deletedId);

					// Remove from list
					setJobs((prev) =>
						prev.filter((job) => job.id !== deletedId),
					);
				},
			)
			.subscribe((status) => {
				if (status === "SUBSCRIBED") {
					console.log("[useGenerations] Realtime channel subscribed");
				} else if (status === "CHANNEL_ERROR") {
					console.warn(
						"[useGenerations] Realtime unavailable - live updates disabled",
					);
				}
			});

		channelRef.current = channel;

		return () => {
			if (channelRef.current) {
				console.log("[useGenerations] Unsubscribing from Realtime");
				supabase.removeChannel(channelRef.current);
				channelRef.current = null;
			}
		};
	}, [isAuthenticated, user?.id]);

	return {
		jobs,
		isLoading: authLoading || isLoading,
		error,
		refetch: fetchJobs,
		deleteJob,
		isDeleting,
	};
}
