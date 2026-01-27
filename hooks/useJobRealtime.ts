"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import type { RealtimeChannel } from "@supabase/supabase-js";

export type JobStatus = "pending" | "running" | "succeeded" | "failed";

interface JobPayload {
	id: string;
	status: JobStatus;
	latex_text: string | null;
	pdf_url: string | null;
	error_message: string | null;
}

export interface UseJobRealtimeOptions {
	onRunning?: () => void;
	onSuccess?: (latexText: string) => void;
	onError?: (errorMessage: string) => void;
}

export interface UseJobRealtimeReturn {
	isSubscribed: boolean;
	status: JobStatus | null;
	latexText: string | null;
	errorMessage: string | null;
	subscribe: (jobId: string) => void;
	unsubscribe: () => void;
}

/**
 * Hook for subscribing to Supabase Realtime updates on a generation job.
 * Replaces polling with push-based updates.
 *
 * Usage:
 * ```
 * const { subscribe, unsubscribe, status, latexText } = useJobRealtime({
 *   onSuccess: (latex) => setStep(2),
 *   onError: (msg) => toast.error(msg)
 * });
 *
 * // Start subscription
 * subscribe(jobId);
 *
 * // Cleanup on unmount is automatic
 * ```
 */
export function useJobRealtime(
	options: UseJobRealtimeOptions = {},
): UseJobRealtimeReturn {
	const { onRunning, onSuccess, onError } = options;

	const [isSubscribed, setIsSubscribed] = useState(false);
	const [status, setStatus] = useState<JobStatus | null>(null);
	const [latexText, setLatexText] = useState<string | null>(null);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const channelRef = useRef<RealtimeChannel | null>(null);
	const jobIdRef = useRef<string | null>(null);

	// Stable callback refs to avoid re-subscribing on option changes
	const onRunningRef = useRef(onRunning);
	const onSuccessRef = useRef(onSuccess);
	const onErrorRef = useRef(onError);

	useEffect(() => {
		onRunningRef.current = onRunning;
		onSuccessRef.current = onSuccess;
		onErrorRef.current = onError;
	}, [onRunning, onSuccess, onError]);

	const unsubscribe = useCallback(() => {
		if (channelRef.current) {
			const supabase = supabaseBrowser();
			supabase.removeChannel(channelRef.current);
			channelRef.current = null;
		}
		setIsSubscribed(false);
		jobIdRef.current = null;
	}, []);

	const subscribe = useCallback(
		(jobId: string) => {
			// Clean up any existing subscription
			unsubscribe();

			jobIdRef.current = jobId;
			setStatus("pending");
			setLatexText(null);
			setErrorMessage(null);

			const supabase = supabaseBrowser();

			// Create a unique channel name for this job
			const channel = supabase
				.channel(`job:${jobId}`)
				.on(
					"postgres_changes",
					{
						event: "UPDATE",
						schema: "public",
						table: "generation_jobs",
						filter: `id=eq.${jobId}`,
					},
					(payload) => {
						const job = payload.new as JobPayload;
						console.log(
							`[Realtime] Job ${jobId} update:`,
							job.status,
						);

						setStatus(job.status);

						if (job.status === "running") {
							onRunningRef.current?.();
						} else if (job.status === "succeeded") {
							setLatexText(job.latex_text);
							onSuccessRef.current?.(job.latex_text || "");
							// Auto-unsubscribe on terminal state
							unsubscribe();
						} else if (job.status === "failed") {
							const msg =
								job.error_message ||
								"Generation failed. Please try again.";
							setErrorMessage(msg);
							onErrorRef.current?.(msg);
							// Auto-unsubscribe on terminal state
							unsubscribe();
						}
					},
				)
				.subscribe((status) => {
					console.log(`[Realtime] Channel status: ${status}`);
					if (status === "SUBSCRIBED") {
						setIsSubscribed(true);
					} else if (status === "CHANNEL_ERROR") {
						console.error("[Realtime] Channel error");
						setErrorMessage("Connection error. Please try again.");
						onErrorRef.current?.(
							"Connection error. Please try again.",
						);
						unsubscribe();
					}
				});

			channelRef.current = channel;

			// Initial fetch to handle race conditions (e.g. job finished before subscription)
			supabase
				.from("generation_jobs")
				.select("status, latex_text, error_message")
				.eq("id", jobId)
				.single()
				.then(({ data, error }) => {
					if (error || !data) return;

					console.log(
						`[Realtime] Initial fetch for ${jobId}:`,
						data.status,
					);

					// Only update if we're still checking this job
					if (jobIdRef.current !== jobId) return;

					setStatus(data.status as JobStatus);

					if (data.status === "succeeded") {
						setLatexText(data.latex_text);
						onSuccessRef.current?.(data.latex_text || "");
						unsubscribe();
					} else if (data.status === "failed") {
						const msg =
							data.error_message ||
							"Generation failed. Please try again.";
						setErrorMessage(msg);
						onErrorRef.current?.(msg);
						unsubscribe();
					} else if (data.status === "running") {
						onRunningRef.current?.();
					}
				});
		},
		[unsubscribe],
	);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (channelRef.current) {
				const supabase = supabaseBrowser();
				supabase.removeChannel(channelRef.current);
			}
		};
	}, []);

	return {
		isSubscribed,
		status,
		latexText,
		errorMessage,
		subscribe,
		unsubscribe,
	};
}
