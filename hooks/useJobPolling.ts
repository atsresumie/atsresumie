"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface GenerationJob {
	id: string;
	status: "pending" | "running" | "succeeded" | "failed";
	pdfUrl: string | null;
	errorMessage: string | null;
	createdAt: string;
	updatedAt: string;
	startedAt: string | null;
	completedAt: string | null;
}

interface UseJobPollingOptions {
	onSuccess?: (job: GenerationJob) => void;
	onError?: (job: GenerationJob) => void;
	pollInterval?: number;
}

interface UseJobPollingReturn {
	job: GenerationJob | null;
	isPolling: boolean;
	error: string | null;
	startPolling: (jobId: string) => void;
	stopPolling: () => void;
}

export function useJobPolling(
	options: UseJobPollingOptions = {},
): UseJobPollingReturn {
	const { onSuccess, onError, pollInterval = 1000 } = options;

	const [job, setJob] = useState<GenerationJob | null>(null);
	const [isPolling, setIsPolling] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const jobIdRef = useRef<string | null>(null);
	const intervalRef = useRef<NodeJS.Timeout | null>(null);

	const fetchJob = useCallback(
		async (jobId: string): Promise<GenerationJob | null> => {
			try {
				const res = await fetch(`/api/jobs/${jobId}`);
				if (!res.ok) {
					const data = await res.json().catch(() => ({}));
					throw new Error(data.error || "Failed to fetch job");
				}
				return await res.json();
			} catch (err) {
				console.error("Failed to fetch job:", err);
				throw err;
			}
		},
		[],
	);

	const stopPolling = useCallback(() => {
		if (intervalRef.current) {
			clearInterval(intervalRef.current);
			intervalRef.current = null;
		}
		setIsPolling(false);
		jobIdRef.current = null;
	}, []);

	const startPolling = useCallback(
		(jobId: string) => {
			// Stop any existing polling
			stopPolling();

			jobIdRef.current = jobId;
			setIsPolling(true);
			setError(null);
			setJob(null);

			const poll = async () => {
				if (!jobIdRef.current) return;

				try {
					const jobData = await fetchJob(jobIdRef.current);
					if (!jobData) return;

					setJob(jobData);

					// Check for terminal states
					if (jobData.status === "succeeded") {
						stopPolling();
						onSuccess?.(jobData);
					} else if (jobData.status === "failed") {
						stopPolling();
						setError(jobData.errorMessage || "Generation failed");
						onError?.(jobData);
					}
				} catch (err) {
					setError(
						err instanceof Error ? err.message : "Polling failed",
					);
					stopPolling();
				}
			};

			// Initial fetch
			poll();

			// Start interval
			intervalRef.current = setInterval(poll, pollInterval);
		},
		[fetchJob, stopPolling, onSuccess, onError, pollInterval],
	);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}
		};
	}, []);

	return {
		job,
		isPolling,
		error,
		startPolling,
		stopPolling,
	};
}
