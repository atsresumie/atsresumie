"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";
import { supabaseBrowser } from "@/lib/supabase/browser";

/**
 * User profile data
 */
export interface UserProfile {
	id: string;
	name: string | null;
	role_title: string | null;
	location: string | null;
	industries: string | null;
	skills: string | null;
	email_on_complete: boolean;
}

interface UseProfileReturn {
	profile: UserProfile | null;
	isLoading: boolean;
	error: string | null;
	updateProfile: (updates: Partial<UserProfile>) => Promise<boolean>;
	isSaving: boolean;
}

/**
 * Hook to fetch and update user profile data.
 */
export function useProfile(): UseProfileReturn {
	const { isAuthenticated, isLoading: authLoading, user } = useAuth();
	const [profile, setProfile] = useState<UserProfile | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isSaving, setIsSaving] = useState(false);

	// Fetch profile
	const fetchProfile = useCallback(async () => {
		if (!isAuthenticated || !user?.id) {
			setProfile(null);
			setIsLoading(false);
			return;
		}

		try {
			setError(null);
			const supabase = supabaseBrowser();

			// Try to fetch profile with new columns
			// If columns don't exist (migration not run), fall back gracefully
			const { data, error: fetchError } = await supabase
				.from("user_profiles")
				.select("*")
				.eq("id", user.id)
				.single();

			if (fetchError) {
				// Profile might not exist yet or migration not run
				console.warn("Profile fetch issue:", fetchError.code);
				// Provide default profile
				setProfile({
					id: user.id,
					name: null,
					role_title: null,
					location: null,
					industries: null,
					skills: null,
					email_on_complete: true,
				});
			} else {
				// Map data to profile, handling missing columns
				setProfile({
					id: data.id,
					name: data.name ?? null,
					role_title: data.role_title ?? null,
					location: data.location ?? null,
					industries: data.industries ?? null,
					skills: data.skills ?? null,
					email_on_complete: data.email_on_complete ?? true,
				});
			}
		} catch (err) {
			console.warn(
				"Profile fetch error (migration may not be run):",
				err,
			);
			// Fall back to default profile instead of erroring
			setProfile({
				id: user.id,
				name: null,
				role_title: null,
				location: null,
				industries: null,
				skills: null,
				email_on_complete: true,
			});
		} finally {
			setIsLoading(false);
		}
	}, [isAuthenticated, user?.id]);

	// Update profile
	const updateProfile = useCallback(
		async (updates: Partial<UserProfile>): Promise<boolean> => {
			if (!isAuthenticated || !user?.id) {
				return false;
			}

			setIsSaving(true);
			setError(null);

			try {
				const supabase = supabaseBrowser();

				const { error: updateError } = await supabase
					.from("user_profiles")
					.update({
						...updates,
						updated_at: new Date().toISOString(),
					})
					.eq("id", user.id);

				if (updateError) {
					throw updateError;
				}

				// Update local state
				setProfile((prev) => (prev ? { ...prev, ...updates } : null));

				return true;
			} catch (err) {
				console.error("Failed to update profile:", err);
				setError(
					err instanceof Error
						? err.message
						: "Failed to save profile",
				);
				return false;
			} finally {
				setIsSaving(false);
			}
		},
		[isAuthenticated, user?.id],
	);

	// Initial fetch
	useEffect(() => {
		if (!authLoading) {
			fetchProfile();
		}
	}, [authLoading, fetchProfile]);

	return {
		profile,
		isLoading: authLoading || isLoading,
		error,
		updateProfile,
		isSaving,
	};
}
