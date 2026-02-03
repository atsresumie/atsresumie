"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "./useAuth";
import { supabaseBrowser } from "@/lib/supabase/browser";
import type { RealtimeChannel } from "@supabase/supabase-js";

/**
 * Resume version record from database
 */
export interface ResumeVersion {
	id: string;
	user_id: string;
	label: string;
	file_name: string;
	file_type: string | null;
	object_path: string;
	resume_text: string | null;
	is_default: boolean;
	created_at: string;
	updated_at: string;
}

interface UseResumeVersionsReturn {
	resumes: ResumeVersion[];
	defaultResume: ResumeVersion | null;
	isLoading: boolean;
	error: string | null;
	refetch: () => Promise<void>;
	uploadResume: (file: File, label?: string) => Promise<ResumeVersion | null>;
	setDefault: (id: string) => Promise<boolean>;
	deleteResume: (id: string) => Promise<boolean>;
	isMutating: boolean;
}

const MAX_RESUMES = 50;

/**
 * Get file extension from filename
 */
function getFileExtension(filename: string): string {
	const parts = filename.split(".");
	return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
}

/**
 * Get file type category
 */
function getFileType(filename: string): string {
	const ext = getFileExtension(filename);
	if (ext === "pdf") return "pdf";
	if (ext === "docx" || ext === "doc") return "docx";
	if (ext === "txt") return "txt";
	return ext;
}

/**
 * Returns relative time string
 */
export function getRelativeTime(dateString: string): string {
	const date = new Date(dateString);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffMins = Math.floor(diffMs / 60000);
	const diffHours = Math.floor(diffMins / 60);
	const diffDays = Math.floor(diffHours / 24);

	if (diffMins < 1) return "Just now";
	if (diffMins < 60) return `${diffMins}m ago`;
	if (diffHours < 24) return `${diffHours}h ago`;
	if (diffDays < 7) return `${diffDays}d ago`;

	return date.toLocaleDateString();
}

/**
 * Hook to manage resume versions with CRUD and Realtime support.
 */
export function useResumeVersions(): UseResumeVersionsReturn {
	const { isAuthenticated, isLoading: authLoading, user } = useAuth();
	const [resumes, setResumes] = useState<ResumeVersion[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isMutating, setIsMutating] = useState(false);

	const channelRef = useRef<RealtimeChannel | null>(null);

	// Derive default resume from list
	const defaultResume = resumes.find((r) => r.is_default) || null;

	// Fetch resume versions
	const fetchResumes = useCallback(async () => {
		if (!isAuthenticated || !user?.id) {
			setResumes([]);
			setIsLoading(false);
			return;
		}

		try {
			setError(null);
			const supabase = supabaseBrowser();

			const { data, error: fetchError } = await supabase
				.from("resume_versions")
				.select("*")
				.eq("user_id", user.id)
				.order("created_at", { ascending: false })
				.limit(MAX_RESUMES);

			if (fetchError) {
				throw fetchError;
			}

			setResumes((data as ResumeVersion[]) || []);
		} catch (err) {
			console.error("Failed to fetch resume versions:", err);
			setError(
				err instanceof Error ? err.message : "Failed to load resumes",
			);
		} finally {
			setIsLoading(false);
		}
	}, [isAuthenticated, user?.id]);

	// Upload a new resume
	const uploadResume = useCallback(
		async (file: File, label?: string): Promise<ResumeVersion | null> => {
			if (!isAuthenticated || !user?.id) {
				return null;
			}

			setIsMutating(true);
			setError(null);

			try {
				const supabase = supabaseBrowser();

				// Generate ID for storage path
				const resumeId = crypto.randomUUID();
				const ext = getFileExtension(file.name);
				const objectPath = `resumes/${user.id}/${resumeId}.${ext}`;

				// 1. Upload file to Supabase Storage
				const { error: uploadError } = await supabase.storage
					.from("resumes")
					.upload(objectPath, file, {
						contentType: file.type,
						upsert: false,
					});

				if (uploadError) {
					throw new Error(`Upload failed: ${uploadError.message}`);
				}

				// 2. Extract text from file (server-side via API)
				let resumeText: string | null = null;
				try {
					const extractRes = await fetch(
						"/api/resumes/extract-text",
						{
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({ objectPath }),
						},
					);

					if (extractRes.ok) {
						const extractData = await extractRes.json();
						resumeText = extractData.text || null;
					} else {
						console.warn(
							"Text extraction failed, continuing without text",
						);
					}
				} catch (extractErr) {
					console.warn("Text extraction error:", extractErr);
				}

				// 3. Check if user has any resumes (to determine default)
				const hasExisting = resumes.length > 0;

				// 4. Generate label if not provided
				const finalLabel =
					label?.trim() || `Resume v${resumes.length + 1}`;

				// 5. Insert into database
				const { data, error: insertError } = await supabase
					.from("resume_versions")
					.insert({
						id: resumeId,
						user_id: user.id,
						label: finalLabel,
						file_name: file.name,
						file_type: getFileType(file.name),
						object_path: objectPath,
						resume_text: resumeText,
						is_default: !hasExisting, // First upload becomes default
					})
					.select()
					.single();

				if (insertError) {
					// Clean up uploaded file on DB error
					await supabase.storage.from("resumes").remove([objectPath]);
					throw insertError;
				}

				const newResume = data as ResumeVersion;

				// Optimistic update: prepend to list
				setResumes((prev) =>
					[newResume, ...prev].slice(0, MAX_RESUMES),
				);

				return newResume;
			} catch (err) {
				console.error("Failed to upload resume:", err);
				setError(
					err instanceof Error
						? err.message
						: "Failed to upload resume",
				);
				return null;
			} finally {
				setIsMutating(false);
			}
		},
		[isAuthenticated, user?.id, resumes.length],
	);

	// Set a resume as default (atomic via RPC)
	const setDefault = useCallback(
		async (id: string): Promise<boolean> => {
			if (!isAuthenticated || !user?.id) {
				return false;
			}

			setIsMutating(true);
			try {
				const supabase = supabaseBrowser();

				// Use atomic RPC to set default (handles race conditions)
				const { error: rpcError } = await supabase.rpc(
					"set_default_resume",
					{ p_resume_id: id },
				);

				if (rpcError) {
					throw rpcError;
				}

				// Optimistic update
				setResumes((prev) =>
					prev.map((r) => ({
						...r,
						is_default: r.id === id,
					})),
				);

				return true;
			} catch (err) {
				console.error("Failed to set default resume:", err);
				setError(
					err instanceof Error
						? err.message
						: "Failed to set default",
				);
				return false;
			} finally {
				setIsMutating(false);
			}
		},
		[isAuthenticated, user?.id],
	);

	// Delete a resume
	const deleteResume = useCallback(
		async (id: string): Promise<boolean> => {
			if (!isAuthenticated || !user?.id) {
				return false;
			}

			setIsMutating(true);
			try {
				const supabase = supabaseBrowser();

				// Find the resume to delete
				const resumeToDelete = resumes.find((r) => r.id === id);
				if (!resumeToDelete) {
					throw new Error("Resume not found");
				}

				const wasDefault = resumeToDelete.is_default;

				// 1. Delete from database
				const { error: deleteError } = await supabase
					.from("resume_versions")
					.delete()
					.eq("id", id)
					.eq("user_id", user.id);

				if (deleteError) {
					throw deleteError;
				}

				// 2. Delete from storage (non-blocking error, log only)
				try {
					const { error: storageError } = await supabase.storage
						.from("resumes")
						.remove([resumeToDelete.object_path]);

					if (storageError) {
						console.warn(
							"Storage cleanup failed:",
							storageError.message,
						);
					}
				} catch (storageErr) {
					console.warn("Storage cleanup error:", storageErr);
				}

				// 3. Optimistic update: remove from list
				const remaining = resumes.filter((r) => r.id !== id);
				setResumes(remaining);

				// 4. If deleted was default and there are remaining resumes, set newest as default
				if (wasDefault && remaining.length > 0) {
					const newestRemaining = remaining[0]; // Already sorted by created_at DESC
					await setDefault(newestRemaining.id);
				}

				return true;
			} catch (err) {
				console.error("Failed to delete resume:", err);
				setError(
					err instanceof Error
						? err.message
						: "Failed to delete resume",
				);
				return false;
			} finally {
				setIsMutating(false);
			}
		},
		[isAuthenticated, user?.id, resumes, setDefault],
	);

	// Initial fetch when auth is ready
	useEffect(() => {
		if (!authLoading) {
			fetchResumes();
		}
	}, [authLoading, fetchResumes]);

	// Subscribe to Realtime updates
	useEffect(() => {
		if (!isAuthenticated || !user?.id) {
			return;
		}

		const supabase = supabaseBrowser();

		const channel = supabase
			.channel(`resume_versions:${user.id}`)
			.on(
				"postgres_changes",
				{
					event: "INSERT",
					schema: "public",
					table: "resume_versions",
					filter: `user_id=eq.${user.id}`,
				},
				(payload) => {
					const newResume = payload.new as ResumeVersion;
					console.log(
						"[useResumeVersions] New resume:",
						newResume.id,
					);

					// Dedupe: upsert by id, then re-sort by created_at DESC
					setResumes((prev) => {
						const filtered = prev.filter(
							(r) => r.id !== newResume.id,
						);
						const updated = [newResume, ...filtered];
						return updated
							.sort(
								(a, b) =>
									new Date(b.created_at).getTime() -
									new Date(a.created_at).getTime(),
							)
							.slice(0, MAX_RESUMES);
					});
				},
			)
			.on(
				"postgres_changes",
				{
					event: "UPDATE",
					schema: "public",
					table: "resume_versions",
					filter: `user_id=eq.${user.id}`,
				},
				(payload) => {
					const updatedResume = payload.new as ResumeVersion;
					console.log(
						"[useResumeVersions] Resume updated:",
						updatedResume.id,
					);

					setResumes((prev) =>
						prev.map((r) =>
							r.id === updatedResume.id ? updatedResume : r,
						),
					);
				},
			)
			.on(
				"postgres_changes",
				{
					event: "DELETE",
					schema: "public",
					table: "resume_versions",
					filter: `user_id=eq.${user.id}`,
				},
				(payload) => {
					const deletedId = (payload.old as { id: string }).id;
					console.log(
						"[useResumeVersions] Resume deleted:",
						deletedId,
					);

					setResumes((prev) =>
						prev.filter((r) => r.id !== deletedId),
					);
				},
			)
			.subscribe((status) => {
				if (status === "SUBSCRIBED") {
					console.log(
						"[useResumeVersions] Realtime channel subscribed",
					);
				} else if (status === "CHANNEL_ERROR") {
					console.warn(
						"[useResumeVersions] Realtime unavailable - live updates disabled",
					);
				}
			});

		channelRef.current = channel;

		return () => {
			if (channelRef.current) {
				console.log("[useResumeVersions] Unsubscribing from Realtime");
				supabase.removeChannel(channelRef.current);
				channelRef.current = null;
			}
		};
	}, [isAuthenticated, user?.id]);

	return {
		resumes,
		defaultResume,
		isLoading: authLoading || isLoading,
		error,
		refetch: fetchResumes,
		uploadResume,
		setDefault,
		deleteResume,
		isMutating,
	};
}
