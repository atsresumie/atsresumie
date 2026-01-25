import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getOnboardingSessionId } from "@/lib/onboarding/cookie";

// Maximum JD text length (characters)
const MAX_JD_LENGTH = 50000;

interface SaveDraftBody {
	jdText: string;
	jdSourceUrl?: string;
	jdTitle?: string;
	jdCompany?: string;
	resumeBucket: string;
	resumeObjectPath: string;
	resumeOriginalFilename?: string;
	resumeMimeType?: string;
	resumeSizeBytes?: number;
	resumeExtractedText?: string;
	resumeStatus?: "temp" | "final"; // For soft-commit flow
}

/**
 * POST /api/onboarding/save-draft
 *
 * Save an onboarding draft with JD text and resume metadata.
 * Requires an active onboarding session (cookie).
 *
 * Request body:
 * - jdText: string (required)
 * - jdSourceUrl?: string
 * - jdTitle?: string
 * - jdCompany?: string
 * - resumeBucket: string (required)
 * - resumeObjectPath: string (required)
 * - resumeOriginalFilename?: string
 * - resumeMimeType?: string
 * - resumeSizeBytes?: number
 * - resumeExtractedText?: string
 *
 * Response:
 * - draftId: string
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

		// Parse request body
		const body = (await request.json()) as SaveDraftBody;
		const {
			jdText,
			jdSourceUrl,
			jdTitle,
			jdCompany,
			resumeBucket,
			resumeObjectPath,
			resumeOriginalFilename,
			resumeMimeType,
			resumeSizeBytes,
			resumeExtractedText,
			resumeStatus = "temp", // Default to temp for soft-commit
		} = body;

		// Validate required fields
		if (!jdText || typeof jdText !== "string") {
			return NextResponse.json(
				{ error: "jdText is required" },
				{ status: 400 },
			);
		}

		if (jdText.length > MAX_JD_LENGTH) {
			return NextResponse.json(
				{
					error: `Job description exceeds maximum length (${MAX_JD_LENGTH} characters)`,
				},
				{ status: 400 },
			);
		}

		if (!resumeBucket || typeof resumeBucket !== "string") {
			return NextResponse.json(
				{ error: "resumeBucket is required" },
				{ status: 400 },
			);
		}

		if (!resumeObjectPath || typeof resumeObjectPath !== "string") {
			return NextResponse.json(
				{ error: "resumeObjectPath is required" },
				{ status: 400 },
			);
		}

		// Verify session exists and is active
		const admin = supabaseAdmin();
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

		// Use UPSERT to update existing draft or create new one
		// This ensures we don't create multiple drafts per session
		const draftData = {
			session_id: sessionId,
			jd_text: jdText,
			jd_source_url: jdSourceUrl || null,
			jd_title: jdTitle || null,
			jd_company: jdCompany || null,
			resume_bucket: resumeBucket,
			resume_object_path: resumeObjectPath,
			resume_original_filename: resumeOriginalFilename || null,
			resume_mime_type: resumeMimeType || null,
			resume_size_bytes: resumeSizeBytes || null,
			resume_extracted_text: resumeExtractedText || null,
			resume_status: resumeStatus,
			resume_uploaded_at: new Date().toISOString(),
		};

		// Check if draft exists for this session
		const { data: existingDraft } = await admin
			.from("onboarding_drafts")
			.select("id")
			.eq("session_id", sessionId)
			.order("created_at", { ascending: false })
			.limit(1)
			.single();

		let draft;
		let draftError;

		if (existingDraft) {
			// Update existing draft
			const result = await admin
				.from("onboarding_drafts")
				.update(draftData)
				.eq("id", existingDraft.id)
				.select("id")
				.single();
			draft = result.data;
			draftError = result.error;
		} else {
			// Insert new draft
			const result = await admin
				.from("onboarding_drafts")
				.insert(draftData)
				.select("id")
				.single();
			draft = result.data;
			draftError = result.error;
		}

		if (draftError || !draft) {
			console.error("Failed to save draft:", draftError);
			return NextResponse.json(
				{ error: "Failed to save draft" },
				{ status: 500 },
			);
		}

		return NextResponse.json({ draftId: draft.id });
	} catch (error) {
		console.error("Error in /api/onboarding/save-draft:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
