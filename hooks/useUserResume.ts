"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";
import { supabaseBrowser } from "@/lib/supabase/browser";

interface UserResume {
	resumeObjectPath: string;
	resumeFilename: string | null;
}

interface UseUserResumeReturn {
	resume: UserResume | null;
	isLoading: boolean;
	error: string | null;
	refetch: () => Promise<void>;
}

/**
 * Hook to fetch the user's most recent resume from their generation jobs.
 * MVP: Uses resume_object_path from the most recent successful generation.
 */
export function useUserResume(): UseUserResumeReturn {
	const { isAuthenticated, isLoading: authLoading, user } = useAuth();
	const [resume, setResume] = useState<UserResume | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchResume = useCallback(async () => {
		if (!isAuthenticated || !user?.id) {
			setResume(null);
			setIsLoading(false);
			return;
		}

		try {
			setError(null);
			const supabase = supabaseBrowser();

			// Get the most recent generation job with a resume
			const { data, error: fetchError } = await supabase
				.from("generation_jobs")
				.select("resume_object_path")
				.eq("user_id", user.id)
				.not("resume_object_path", "is", null)
				.order("created_at", { ascending: false })
				.limit(1)
				.single();

			if (fetchError) {
				// PGRST116 means no rows found - not an error
				if (fetchError.code === "PGRST116") {
					setResume(null);
				} else {
					throw fetchError;
				}
			} else if (data?.resume_object_path) {
				// Extract filename from path
				const pathParts = data.resume_object_path.split("/");
				const filename = pathParts[pathParts.length - 1] || null;

				setResume({
					resumeObjectPath: data.resume_object_path,
					resumeFilename: filename,
				});
			} else {
				setResume(null);
			}
		} catch (err) {
			console.error("Failed to fetch user resume:", err);
			setError(
				err instanceof Error ? err.message : "Failed to load resume",
			);
		} finally {
			setIsLoading(false);
		}
	}, [isAuthenticated, user?.id]);

	// Initial fetch when auth is ready
	useEffect(() => {
		if (!authLoading) {
			fetchResume();
		}
	}, [authLoading, fetchResume]);

	return {
		resume,
		isLoading: authLoading || isLoading,
		error,
		refetch: fetchResume,
	};
}
