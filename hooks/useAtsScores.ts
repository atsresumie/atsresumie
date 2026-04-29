"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface AtsScoreCache {
	[resumeId: string]: {
		score: number | null;
		loading: boolean;
		error: string | null;
	};
}

interface ResumeForScoring {
	id: string;
	object_path: string;
	file_type: string | null;
	ats_score?: number | null;
}

/**
 * Hook to fetch and cache ATS scores for resume cards.
 *
 * If a resume already has a persisted `ats_score` (cached on the
 * resume_versions row by the API route on first scoring), it's used
 * directly with no network call. Otherwise the score is fetched lazily
 * via the /api/ats-score proxy, which writes the result back to the DB
 * so future visits hit the cache.
 */
export function useAtsScores(resumes: ResumeForScoring[]) {
	const [scores, setScores] = useState<AtsScoreCache>({});
	const fetchedRef = useRef<Set<string>>(new Set());

	const fetchScore = useCallback(
		async (resumeId: string, objectPath: string) => {
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
					body: JSON.stringify({
						objectPath,
						resumeVersionId: resumeId,
					}),
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

	useEffect(() => {
		for (const resume of resumes) {
			// Only PDFs are scored by the /analyze/general endpoint.
			if (resume.file_type !== "pdf") continue;

			// Use the persisted score from the DB and skip the network call.
			if (typeof resume.ats_score === "number") {
				if (!fetchedRef.current.has(resume.id)) {
					fetchedRef.current.add(resume.id);
					setScores((prev) => {
						const existing = prev[resume.id];
						if (existing && existing.score === resume.ats_score) {
							return prev;
						}
						return {
							...prev,
							[resume.id]: {
								score: resume.ats_score ?? null,
								loading: false,
								error: null,
							},
						};
					});
				}
				continue;
			}

			if (!fetchedRef.current.has(resume.id)) {
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
