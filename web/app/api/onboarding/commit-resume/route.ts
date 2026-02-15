import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getOnboardingSessionId } from "@/lib/onboarding/cookie";

/**
 * POST /api/onboarding/commit-resume
 *
 * Commit a temp resume to final storage.
 * This copies the file from temp/ to final/, deletes the temp file,
 * and updates the draft with the final path.
 *
 * Requires an active onboarding session (cookie).
 *
 * Response:
 * - bucket: string
 * - finalPath: string
 * - originalFilename: string
 */
export async function POST(request: NextRequest) {
	try {
		// Require session cookie
		const sessionId = await getOnboardingSessionId();
		if (!sessionId) {
			return NextResponse.json(
				{
					error: "No onboarding session found. Please start a session first.",
				},
				{ status: 400 },
			);
		}

		const admin = supabaseAdmin();

		// Verify session exists and is active
		const { data: session, error: sessionError } = await admin
			.from("onboarding_sessions")
			.select("id, status, expires_at")
			.eq("id", sessionId)
			.single();

		if (sessionError || !session) {
			return NextResponse.json(
				{ error: "Session not found" },
				{ status: 400 },
			);
		}

		if (session.status !== "active") {
			return NextResponse.json(
				{ error: "Session is no longer active" },
				{ status: 400 },
			);
		}

		if (new Date(session.expires_at) <= new Date()) {
			return NextResponse.json(
				{ error: "Session has expired" },
				{ status: 400 },
			);
		}

		// Get the current draft with temp resume info
		const { data: draft, error: draftError } = await admin
			.from("onboarding_drafts")
			.select(
				"id, resume_bucket, resume_object_path, resume_original_filename, resume_status",
			)
			.eq("session_id", sessionId)
			.order("created_at", { ascending: false })
			.limit(1)
			.single();

		if (draftError || !draft) {
			return NextResponse.json(
				{ error: "No draft found for this session" },
				{ status: 400 },
			);
		}

		// If already committed, return success (idempotent)
		if (draft.resume_status === "final") {
			return NextResponse.json({
				bucket: draft.resume_bucket,
				finalPath: draft.resume_object_path,
				originalFilename: draft.resume_original_filename,
				alreadyCommitted: true,
			});
		}

		// Validate temp resume exists
		if (!draft.resume_bucket || !draft.resume_object_path) {
			return NextResponse.json(
				{ error: "No resume to commit" },
				{ status: 400 },
			);
		}

		const bucket = draft.resume_bucket;
		const tempPath = draft.resume_object_path;
		const originalFilename = draft.resume_original_filename || "resume";

		// Validate it's a temp path
		if (!tempPath.includes("/temp/")) {
			// Already in final location, just update status
			const { error: updateError } = await admin
				.from("onboarding_drafts")
				.update({
					resume_status: "final",
					resume_committed_at: new Date().toISOString(),
				})
				.eq("id", draft.id);

			if (updateError) {
				console.error("Failed to update draft status:", updateError);
				return NextResponse.json(
					{ error: "Failed to update draft" },
					{ status: 500 },
				);
			}

			return NextResponse.json({
				bucket,
				finalPath: tempPath,
				originalFilename,
				alreadyCommitted: true,
			});
		}

		// Generate final path (replace /temp/ with /final/)
		const finalPath = tempPath.replace("/temp/", "/final/");

		// Copy from temp to final
		const { error: copyError } = await admin.storage
			.from(bucket)
			.copy(tempPath, finalPath);

		if (copyError) {
			console.error(
				"Failed to copy resume to final location:",
				copyError,
			);
			return NextResponse.json(
				{ error: "Failed to commit resume" },
				{ status: 500 },
			);
		}

		// Delete the temp file
		const { error: deleteError } = await admin.storage
			.from(bucket)
			.remove([tempPath]);

		if (deleteError) {
			// Log but don't fail - the file is already copied
			console.warn(
				"Failed to delete temp file (non-critical):",
				deleteError,
			);
		}

		// Update draft with final path and status
		const { error: updateError } = await admin
			.from("onboarding_drafts")
			.update({
				resume_object_path: finalPath,
				resume_status: "final",
				resume_committed_at: new Date().toISOString(),
			})
			.eq("id", draft.id);

		if (updateError) {
			console.error(
				"Failed to update draft with final path:",
				updateError,
			);
			// The file is already in final location, so we can still return success
			// but log this as an issue
		}

		console.log(`Resume committed: ${tempPath} -> ${finalPath}`);

		return NextResponse.json({
			bucket,
			finalPath,
			originalFilename,
		});
	} catch (error) {
		console.error("Error in /api/onboarding/commit-resume:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
