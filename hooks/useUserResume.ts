"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";
import { supabaseBrowser } from "@/lib/supabase/browser";

interface UserResume {
	resumeObjectPath: string;
	resumeFilename: string | null;
	resumeLabel: string | null;
}

interface UseUserResumeReturn {
	resume: UserResume | null;
	isLoading: boolean;
	error: string | null;
	refetch: () => Promise<void>;
}

/**
 * Hook to fetch the user's default resume from the resume_versions table.
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

			// Get the default resume from resume_versions
			const { data, error: fetchError } = await supabase
				.from("resume_versions")
				.select("object_path, file_name, label")
				.eq("user_id", user.id)
				.eq("is_default", true)
				.limit(1)
				.single();

			if (fetchError) {
				// PGRST116 means no rows found - not an error, user has no resume
				if (fetchError.code === "PGRST116") {
					setResume(null);
				} else {
					throw fetchError;
				}
			} else if (data?.object_path) {
				setResume({
					resumeObjectPath: data.object_path,
					resumeFilename: data.file_name || null,
					resumeLabel: data.label || null,
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
