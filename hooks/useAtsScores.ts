"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface AtsScoreCache {
	[resumeId: string]: {
		score: number | null;
		loading: boolean;
		error: string | null;
	};
}

/**
 * Hook to fetch and cache ATS scores for resume cards.
 *
 * Scores are fetched lazily per resume via the /api/ats-score proxy route.
 * Results are cached in-memory so repeated renders don't re-fetch.
 */
export function useAtsScores(
	resumes: { id: string; object_path: string; file_type: string | null }[],
) {
	const [scores, setScores] = useState<AtsScoreCache>({});
	const fetchedRef = useRef<Set<string>>(new Set());

	const fetchScore = useCallback(
		async (resumeId: string, objectPath: string) => {
			// Already fetched or in progress
			if (fetchedRef.current.has(resumeId)) return;
			fetchedRef.current.add(resumeId);

			setScores((prev) => ({
				...prev,
				[resumeId]: { score: null, loading: true, error: null },
			}));

			try {
				const res = await fetch("/api/ats-score", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ objectPath }),
				});

				if (!res.ok) {
					const errData = await res.json().catch(() => ({}));
					throw new Error(errData.error || `HTTP ${res.status}`);
				}

				const data = await res.json();
				setScores((prev) => ({
					...prev,
					[resumeId]: {
						score: data.score ?? null,
						loading: false,
						error: null,
					},
				}));
			} catch (err) {
				console.error(`[useAtsScores] Failed for ${resumeId}:`, err);
				setScores((prev) => ({
					...prev,
					[resumeId]: {
						score: null,
						loading: false,
						error: err instanceof Error ? err.message : "Scoring failed",
					},
				}));
			}
		},
		[],
	);

	// Fetch scores for all PDF resumes that haven't been fetched yet
	useEffect(() => {
		for (const resume of resumes) {
			// Only score PDF files (the general endpoint requires PDF)
			if (resume.file_type === "pdf" && !fetchedRef.current.has(resume.id)) {
				fetchScore(resume.id, resume.object_path);
			}
		}
	}, [resumes, fetchScore]);

	const getScore = useCallback(
		(resumeId: string) => {
			return (
				scores[resumeId] || { score: null, loading: false, error: null }
			);
		},
		[scores],
	);

	return { getScore };
}
