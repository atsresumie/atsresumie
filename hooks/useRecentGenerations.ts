"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "./useAuth";
import { supabaseBrowser } from "@/lib/supabase/browser";
import type { RealtimeChannel } from "@supabase/supabase-js";

export type GenerationJobStatus =
	| "queued"
	| "processing"
	| "succeeded"
	| "failed";

export type PdfStatus = "none" | "queued" | "processing" | "ready" | "failed";

export interface GenerationJob {
	id: string;
	status: GenerationJobStatus;
	jd_text: string | null;
	pdf_object_path: string | null;
	pdf_status: PdfStatus | null;
	created_at: string;
}

interface UseRecentGenerationsReturn {
	jobs: GenerationJob[];
	isLoading: boolean;
	error: string | null;
	refetch: () => Promise<void>;
}

const MAX_JOBS = 5;

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
 * Hook to fetch and subscribe to the latest 5 generation jobs for the current user.
 * Uses Supabase Realtime for instant updates when jobs are created or updated.
 */
export function useRecentGenerations(): UseRecentGenerationsReturn {
	const { isAuthenticated, isLoading: authLoading, user } = useAuth();
	const [jobs, setJobs] = useState<GenerationJob[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const channelRef = useRef<RealtimeChannel | null>(null);

	// Fetch latest 5 jobs
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
					"id, status, jd_text, pdf_object_path, pdf_status, created_at",
				)
				.eq("user_id", user.id)
				.order("created_at", { ascending: false })
				.limit(MAX_JOBS);

			if (fetchError) {
				throw fetchError;
			}

			setJobs((data as GenerationJob[]) || []);
		} catch (err) {
			console.error("Failed to fetch recent generations:", err);
			setError(
				err instanceof Error
					? err.message
					: "Failed to load generations",
			);
		} finally {
			setIsLoading(false);
		}
	}, [isAuthenticated, user?.id]);

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
			.channel(`recent-generations:${user.id}`)
			.on(
				"postgres_changes",
				{
					event: "INSERT",
					schema: "public",
					table: "generation_jobs",
					filter: `user_id=eq.${user.id}`,
				},
				(payload) => {
					const newJob = payload.new as GenerationJob;
					console.log("[useRecentGenerations] New job:", newJob.id);

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
					const updatedJob = payload.new as GenerationJob;
					console.log(
						"[useRecentGenerations] Job updated:",
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
			.subscribe((status) => {
				if (status === "SUBSCRIBED") {
					console.log(
						"[useRecentGenerations] Realtime channel subscribed",
					);
				} else if (status === "CHANNEL_ERROR") {
					console.warn(
						"[useRecentGenerations] Realtime unavailable - live updates disabled",
					);
				}
			});

		channelRef.current = channel;

		return () => {
			if (channelRef.current) {
				console.log(
					"[useRecentGenerations] Unsubscribing from Realtime",
				);
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
	};
}
