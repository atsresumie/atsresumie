"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "./useAuth";
import { supabaseBrowser } from "@/lib/supabase/browser";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { deriveJobLabel } from "./useGenerations";

/**
 * Represents a downloadable PDF item in the Download Center.
 */
export interface DownloadItem {
	id: string;
	label: string;
	fileName: string;
	createdAt: string;
	pdfObjectPath: string;
}

interface UseDownloadsReturn {
	downloads: DownloadItem[];
	isLoading: boolean;
	error: string | null;
	refetch: () => Promise<void>;
}

const MAX_DOWNLOADS = 100;

/**
 * Sanitizes a label to create a valid filename.
 * Removes illegal chars, trims, limits length, with fallback.
 */
export function sanitizeFileName(label: string): string {
	const sanitized = label
		.replace(/[\/\\:*?"<>|]/g, "") // Remove illegal filename chars
		.replace(/\s+/g, " ") // Normalize whitespace
		.trim()
		.slice(0, 100); // Limit length

	return sanitized || "resume";
}

/**
 * Raw job shape from DB (minimal columns for performance).
 */
interface RawJobRow {
	id: string;
	jd_text: string | null;
	created_at: string;
	pdf_object_path: string;
}

/**
 * Maps a raw job row to a DownloadItem.
 */
function mapJobToDownload(job: RawJobRow): DownloadItem {
	const label = deriveJobLabel(job.jd_text);
	return {
		id: job.id,
		label,
		fileName: `${sanitizeFileName(label)}.pdf`,
		createdAt: job.created_at,
		pdfObjectPath: job.pdf_object_path,
	};
}

/**
 * Hook to fetch and subscribe to downloadable PDFs.
 * Returns only jobs where pdf_object_path is not null.
 * Includes Supabase Realtime subscription for instant updates.
 */
export function useDownloads(): UseDownloadsReturn {
	const { isAuthenticated, isLoading: authLoading, user } = useAuth();
	const [downloads, setDownloads] = useState<DownloadItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const channelRef = useRef<RealtimeChannel | null>(null);

	// Fetch downloads
	const fetchDownloads = useCallback(async () => {
		if (!isAuthenticated || !user?.id) {
			setDownloads([]);
			setIsLoading(false);
			return;
		}

		try {
			setError(null);
			const supabase = supabaseBrowser();

			// Minimal columns for performance
			const { data, error: fetchError } = await supabase
				.from("generation_jobs")
				.select("id, jd_text, created_at, pdf_object_path")
				.eq("user_id", user.id)
				.not("pdf_object_path", "is", null)
				.order("created_at", { ascending: false })
				.limit(MAX_DOWNLOADS);

			if (fetchError) {
				throw fetchError;
			}

			const items = (data as RawJobRow[]).map(mapJobToDownload);
			setDownloads(items);
		} catch (err) {
			console.error("Failed to fetch downloads:", err);
			setError(
				err instanceof Error ? err.message : "Failed to load downloads",
			);
		} finally {
			setIsLoading(false);
		}
	}, [isAuthenticated, user?.id]);

	// Initial fetch when auth is ready
	useEffect(() => {
		if (!authLoading) {
			fetchDownloads();
		}
	}, [authLoading, fetchDownloads]);

	// Subscribe to Realtime updates
	useEffect(() => {
		if (!isAuthenticated || !user?.id) {
			return;
		}

		const supabase = supabaseBrowser();

		const channel = supabase
			.channel(`downloads:${user.id}`)
			.on(
				"postgres_changes",
				{
					event: "UPDATE",
					schema: "public",
					table: "generation_jobs",
					filter: `user_id=eq.${user.id}`,
				},
				(payload) => {
					const job = payload.new as RawJobRow;

					// Only care about jobs with PDF
					if (!job.pdf_object_path) return;

					setDownloads((prev) => {
						const idx = prev.findIndex((d) => d.id === job.id);
						if (idx >= 0) {
							// Update existing row (e.g., jd_text changed)
							const updated = [...prev];
							updated[idx] = mapJobToDownload(job);
							return updated;
						}
						// New PDF (null → non-null transition) - prepend
						return [mapJobToDownload(job), ...prev].slice(
							0,
							MAX_DOWNLOADS,
						);
					});
				},
			)
			.on(
				"postgres_changes",
				{
					event: "INSERT",
					schema: "public",
					table: "generation_jobs",
					filter: `user_id=eq.${user.id}`,
				},
				(payload) => {
					const job = payload.new as RawJobRow;

					// Only care about jobs with PDF (rare on insert, but handle it)
					if (!job.pdf_object_path) return;

					setDownloads((prev) => {
						// Dedupe check
						if (prev.some((d) => d.id === job.id)) {
							return prev;
						}
						return [mapJobToDownload(job), ...prev].slice(
							0,
							MAX_DOWNLOADS,
						);
					});
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
					setDownloads((prev) =>
						prev.filter((d) => d.id !== deletedId),
					);
				},
			)
			.subscribe((status) => {
				if (status === "SUBSCRIBED") {
					console.log("[useDownloads] Realtime channel subscribed");
				} else if (status === "CHANNEL_ERROR") {
					console.warn(
						"[useDownloads] Realtime unavailable - live updates disabled",
					);
				}
			});

		channelRef.current = channel;

		return () => {
			if (channelRef.current) {
				console.log("[useDownloads] Unsubscribing from Realtime");
				supabase.removeChannel(channelRef.current);
				channelRef.current = null;
			}
		};
	}, [isAuthenticated, user?.id]);

	return {
		downloads,
		isLoading: authLoading || isLoading,
		error,
		refetch: fetchDownloads,
	};
}
