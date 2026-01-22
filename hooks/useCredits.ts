"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";

interface UseCreditsReturn {
	credits: number | null;
	isLoading: boolean;
	error: string | null;
	refetch: () => Promise<void>;
}

export function useCredits(): UseCreditsReturn {
	const { isAuthenticated, isLoading: authLoading } = useAuth();
	const [credits, setCredits] = useState<number | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

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

	useEffect(() => {
		if (!authLoading) {
			fetchCredits();
		}
	}, [authLoading, fetchCredits]);

	return {
		credits,
		isLoading: authLoading || isLoading,
		error,
		refetch: fetchCredits,
	};
}
