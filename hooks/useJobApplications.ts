"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "./useAuth";
import { supabaseBrowser } from "@/lib/supabase/browser";
import type { RealtimeChannel } from "@supabase/supabase-js";

/**
 * Application stage type
 */
export type ApplicationStage =
	| "saved"
	| "applied"
	| "screening"
	| "interview"
	| "offer";

export const APPLICATION_STAGES: ApplicationStage[] = [
	"saved",
	"applied",
	"screening",
	"interview",
	"offer",
];

export const STAGE_LABELS: Record<ApplicationStage, string> = {
	saved: "Saved",
	applied: "Applied",
	screening: "Screening",
	interview: "Interview",
	offer: "Offer",
};

/**
 * Job application record from database
 */
export interface JobApplication {
	id: string;
	user_id: string;
	company: string;
	role: string;
	location: string | null;
	salary: string | null;
	source_url: string | null;
	stage: ApplicationStage;
	position: number;
	applied_at: string | null;
	interview_date: string | null;
	notes: string | null;
	created_at: string;
	updated_at: string;
}

/**
 * Input for creating a new application
 */
export interface CreateApplicationInput {
	company: string;
	role: string;
	location?: string;
	salary?: string;
	source_url?: string;
	stage?: ApplicationStage;
	applied_at?: string;
	interview_date?: string;
	notes?: string;
}

/**
 * Input for updating an application
 */
export interface UpdateApplicationInput {
	id: string;
	company?: string;
	role?: string;
	location?: string | null;
	salary?: string | null;
	source_url?: string | null;
	stage?: ApplicationStage;
	position?: number;
	applied_at?: string | null;
	interview_date?: string | null;
	notes?: string | null;
}

interface UseJobApplicationsReturn {
	applications: JobApplication[];
	isLoading: boolean;
	error: string | null;
	refetch: () => Promise<void>;
	createApplication: (
		input: CreateApplicationInput,
	) => Promise<JobApplication | null>;
	updateApplication: (input: UpdateApplicationInput) => Promise<boolean>;
	deleteApplication: (id: string) => Promise<boolean>;
	moveApplication: (
		id: string,
		newStage: ApplicationStage,
	) => Promise<boolean>;
	isMutating: boolean;
}

const MAX_APPLICATIONS = 200;

/**
 * Hook to manage job applications with CRUD, stage transitions, and Realtime support.
 */
export function useJobApplications(): UseJobApplicationsReturn {
	const { isAuthenticated, isLoading: authLoading, user } = useAuth();
	const [applications, setApplications] = useState<JobApplication[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isMutating, setIsMutating] = useState(false);

	const channelRef = useRef<RealtimeChannel | null>(null);

	// Fetch all applications
	const fetchApplications = useCallback(async () => {
		if (!isAuthenticated || !user?.id) {
			setApplications([]);
			setIsLoading(false);
			return;
		}

		try {
			setError(null);
			const supabase = supabaseBrowser();

			const { data, error: fetchError } = await supabase
				.from("job_applications")
				.select("*")
				.eq("user_id", user.id)
				.order("position", { ascending: true })
				.order("updated_at", { ascending: false })
				.limit(MAX_APPLICATIONS);

			if (fetchError) {
				throw fetchError;
			}

			setApplications((data as JobApplication[]) || []);
		} catch (err) {
			console.error("Failed to fetch applications:", err);
			setError(
				err instanceof Error
					? err.message
					: "Failed to load applications",
			);
		} finally {
			setIsLoading(false);
		}
	}, [isAuthenticated, user?.id]);

	// Create a new application
	const createApplication = useCallback(
		async (
			input: CreateApplicationInput,
		): Promise<JobApplication | null> => {
			if (!isAuthenticated || !user?.id) {
				return null;
			}

			setIsMutating(true);
			try {
				const supabase = supabaseBrowser();

				const { data, error: insertError } = await supabase
					.from("job_applications")
					.insert({
						user_id: user.id,
						company: input.company,
						role: input.role,
						location: input.location || null,
						salary: input.salary || null,
						source_url: input.source_url || null,
						stage: input.stage || "saved",
						applied_at: input.applied_at || null,
						interview_date: input.interview_date || null,
						notes: input.notes || null,
					})
					.select()
					.single();

				if (insertError) {
					throw insertError;
				}

				const newApp = data as JobApplication;

				// Optimistic update
				setApplications((prev) =>
					[newApp, ...prev].slice(0, MAX_APPLICATIONS),
				);

				return newApp;
			} catch (err) {
				console.error("Failed to create application:", err);
				setError(
					err instanceof Error
						? err.message
						: "Failed to create application",
				);
				return null;
			} finally {
				setIsMutating(false);
			}
		},
		[isAuthenticated, user?.id],
	);

	// Update an application
	const updateApplication = useCallback(
		async (input: UpdateApplicationInput): Promise<boolean> => {
			if (!isAuthenticated || !user?.id) {
				return false;
			}

			setIsMutating(true);
			try {
				const supabase = supabaseBrowser();

				const updateData: Record<string, unknown> = {};
				if (input.company !== undefined)
					updateData.company = input.company;
				if (input.role !== undefined) updateData.role = input.role;
				if (input.location !== undefined)
					updateData.location = input.location;
				if (input.salary !== undefined) updateData.salary = input.salary;
				if (input.source_url !== undefined)
					updateData.source_url = input.source_url;
				if (input.stage !== undefined) updateData.stage = input.stage;
				if (input.position !== undefined)
					updateData.position = input.position;
				if (input.applied_at !== undefined)
					updateData.applied_at = input.applied_at;
				if (input.interview_date !== undefined)
					updateData.interview_date = input.interview_date;
				if (input.notes !== undefined) updateData.notes = input.notes;

				const { data, error: updateError } = await supabase
					.from("job_applications")
					.update(updateData)
					.eq("id", input.id)
					.eq("user_id", user.id)
					.select()
					.single();

				if (updateError) {
					throw updateError;
				}

				const updatedApp = data as JobApplication;

				// Optimistic update
				setApplications((prev) =>
					prev.map((app) =>
						app.id === updatedApp.id ? updatedApp : app,
					),
				);

				return true;
			} catch (err) {
				console.error("Failed to update application:", err);
				setError(
					err instanceof Error
						? err.message
						: "Failed to update application",
				);
				return false;
			} finally {
				setIsMutating(false);
			}
		},
		[isAuthenticated, user?.id],
	);

	// Move application to a new stage (convenience method)
	const moveApplication = useCallback(
		async (id: string, newStage: ApplicationStage): Promise<boolean> => {
			// Optimistic update first
			setApplications((prev) =>
				prev.map((app) =>
					app.id === id ? { ...app, stage: newStage } : app,
				),
			);

			const result = await updateApplication({ id, stage: newStage });

			if (!result) {
				// Revert optimistic update on failure
				await fetchApplications();
			}

			return result;
		},
		[updateApplication, fetchApplications],
	);

	// Delete an application
	const deleteApplication = useCallback(
		async (id: string): Promise<boolean> => {
			if (!isAuthenticated || !user?.id) {
				return false;
			}

			setIsMutating(true);
			try {
				const supabase = supabaseBrowser();

				const { error: deleteError } = await supabase
					.from("job_applications")
					.delete()
					.eq("id", id)
					.eq("user_id", user.id);

				if (deleteError) {
					throw deleteError;
				}

				// Optimistic update
				setApplications((prev) =>
					prev.filter((app) => app.id !== id),
				);

				return true;
			} catch (err) {
				console.error("Failed to delete application:", err);
				setError(
					err instanceof Error
						? err.message
						: "Failed to delete application",
				);
				return false;
			} finally {
				setIsMutating(false);
			}
		},
		[isAuthenticated, user?.id],
	);

	// Initial fetch when auth is ready
	useEffect(() => {
		if (!authLoading) {
			fetchApplications();
		}
	}, [authLoading, fetchApplications]);

	// Subscribe to Realtime updates
	useEffect(() => {
		if (!isAuthenticated || !user?.id) {
			return;
		}

		const supabase = supabaseBrowser();

		const channel = supabase
			.channel(`job_applications:${user.id}`)
			.on(
				"postgres_changes",
				{
					event: "INSERT",
					schema: "public",
					table: "job_applications",
					filter: `user_id=eq.${user.id}`,
				},
				(payload) => {
					const newApp = payload.new as JobApplication;
					setApplications((prev) => {
						if (prev.some((app) => app.id === newApp.id)) {
							return prev;
						}
						return [newApp, ...prev].slice(0, MAX_APPLICATIONS);
					});
				},
			)
			.on(
				"postgres_changes",
				{
					event: "UPDATE",
					schema: "public",
					table: "job_applications",
					filter: `user_id=eq.${user.id}`,
				},
				(payload) => {
					const updatedApp = payload.new as JobApplication;
					setApplications((prev) =>
						prev.map((app) =>
							app.id === updatedApp.id ? updatedApp : app,
						),
					);
				},
			)
			.on(
				"postgres_changes",
				{
					event: "DELETE",
					schema: "public",
					table: "job_applications",
					filter: `user_id=eq.${user.id}`,
				},
				(payload) => {
					const deletedId = (payload.old as { id: string }).id;
					setApplications((prev) =>
						prev.filter((app) => app.id !== deletedId),
					);
				},
			)
			.subscribe();

		channelRef.current = channel;

		return () => {
			if (channelRef.current) {
				supabase.removeChannel(channelRef.current);
				channelRef.current = null;
			}
		};
	}, [isAuthenticated, user?.id]);

	return {
		applications,
		isLoading: authLoading || isLoading,
		error,
		refetch: fetchApplications,
		createApplication,
		updateApplication,
		deleteApplication,
		moveApplication,
		isMutating,
	};
}
