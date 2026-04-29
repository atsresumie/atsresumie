import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const LINKEDIN_URL_REGEX =
	/^https?:\/\/(www\.)?linkedin\.com\/in\/[\w-]{3,100}\/?$/;
const LINKEDIN_USERNAME_REGEX = /^[\w-]{3,100}$/;

const APIFY_ACTOR_ID = "harvestapi~linkedin-profile-scraper";
const APIFY_RUN_URL = `https://api.apify.com/v2/acts/${APIFY_ACTOR_ID}/run-sync-get-dataset-items`;
const APIFY_POLL_INTERVAL = 3000;
const APIFY_MAX_WAIT = 60000;

/**
 * POST /api/linkedin/profile
 *
 * Two modes:
 *  1. { url } — scrape via Apify API
 *  2. { url?, pastedText } — user pasted their profile text manually (fallback)
 */
export async function POST(req: Request) {
	try {
		const supabase = await createSupabaseServerClient();
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();

		if (authError || !user) {
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 },
			);
		}

		const body = await req.json();
		const { url, pastedText } = body as {
			url?: string;
			pastedText?: string;
		};

		// ── Mode 2: user pasted their profile text ──────────────────────
		if (
			pastedText &&
			typeof pastedText === "string" &&
			pastedText.trim().length >= 50
		) {
			return await saveResumeText(
				user.id,
				pastedText.trim(),
				extractNameFromText(pastedText.trim()),
				url?.trim() || null,
			);
		}

		// ── Mode 1: scrape from URL via Apify ───────────────────────────
		if (!url || typeof url !== "string") {
			return NextResponse.json(
				{ error: "LinkedIn profile URL is required" },
				{ status: 400 },
			);
		}

		let trimmedUrl = url.trim().replace(/\/$/, "");

		// Accept bare username (e.g. "sujansthadev") and build full URL
		if (LINKEDIN_USERNAME_REGEX.test(trimmedUrl)) {
			trimmedUrl = `https://www.linkedin.com/in/${trimmedUrl}`;
		}

		if (!LINKEDIN_URL_REGEX.test(trimmedUrl)) {
			return NextResponse.json(
				{
					error:
						"Invalid input. Provide a LinkedIn URL (https://linkedin.com/in/username) or just the username.",
				},
				{ status: 400 },
			);
		}

		const token = process.env.LINKEDIN_TOKEN;
		if (!token) {
			console.error("[LinkedIn] LINKEDIN_TOKEN env var is not set");
			return NextResponse.json(
				{
					error: "SCRAPE_BLOCKED",
					message:
						"LinkedIn import is not configured. You can paste your profile text instead.",
				},
				{ status: 422 },
			);
		}

		const profileData = await fetchViaApify(trimmedUrl, token);
		if (!profileData) {
			return NextResponse.json(
				{
					error: "SCRAPE_BLOCKED",
					message:
						"Could not fetch the LinkedIn profile. You can paste your profile text instead.",
				},
				{ status: 422 },
			);
		}

		const resumeText = formatApifyProfileAsResume(profileData, trimmedUrl);

		if (resumeText.trim().length < 50) {
			return NextResponse.json(
				{
					error: "SCRAPE_BLOCKED",
					message:
						"Not enough profile data returned. You can paste your profile text instead.",
				},
				{ status: 422 },
			);
		}

		const profileName = [profileData.firstName, profileData.lastName]
			.filter(Boolean)
			.join(" ") || null;

		return await saveResumeText(
			user.id,
			resumeText,
			profileName,
			trimmedUrl,
		);
	} catch (error) {
		console.error("[LinkedIn] API error:", error);
		return NextResponse.json(
			{ error: "Failed to import LinkedIn profile" },
			{ status: 500 },
		);
	}
}

// ─── Apify ───────────────────────────────────────────────────────────────────

interface ApifyProfile {
	firstName?: string;
	lastName?: string;
	headline?: string;
	about?: string;
	location?: { linkedinText?: string; parsed?: { text?: string } };
	experience?: ApifyExperience[];
	education?: ApifyEducation[];
	certifications?: ApifyCertification[];
	projects?: ApifyProject[];
	skills?: ApifySkill[];
	linkedinUrl?: string;
}

interface ApifyExperience {
	position?: string;
	companyName?: string;
	location?: string;
	employmentType?: string;
	duration?: string;
	description?: string;
	skills?: string[];
	startDate?: { text?: string };
	endDate?: { text?: string };
}

interface ApifyEducation {
	schoolName?: string;
	degree?: string;
	fieldOfStudy?: string;
	period?: string;
	startDate?: { text?: string };
	endDate?: { text?: string };
}

interface ApifyCertification {
	title?: string;
	issuedAt?: string;
	issuedBy?: string;
}

interface ApifyProject {
	title?: string;
	description?: string;
	duration?: string;
}

interface ApifySkill {
	name?: string;
}

/**
 * Call the Apify Actor synchronously and return the first profile item.
 *
 * Uses run-sync-get-dataset-items (waits up to 60s for the run to finish
 * and returns dataset items directly). Falls back to async poll if the
 * sync endpoint times out.
 */
async function fetchViaApify(
	linkedinUrl: string,
	token: string,
): Promise<ApifyProfile | null> {
	// Try sync endpoint first (fastest path)
	const syncResult = await tryApifySync(linkedinUrl, token);
	if (syncResult) return syncResult;

	// Fallback: start run, then poll until done
	return await tryApifyAsync(linkedinUrl, token);
}

async function tryApifySync(
	linkedinUrl: string,
	token: string,
): Promise<ApifyProfile | null> {
	try {
		const response = await fetch(
			`${APIFY_RUN_URL}?token=${encodeURIComponent(token)}`,
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					profileScraperMode:
						"Profile details no email ($4 per 1k)",
					urls: [linkedinUrl],
				}),
				signal: AbortSignal.timeout(APIFY_MAX_WAIT),
			},
		);

		if (!response.ok) {
			console.warn(
				`[LinkedIn/Apify] Sync run returned ${response.status}`,
			);
			return null;
		}

		const items: ApifyProfile[] = await response.json();
		return items?.[0] ?? null;
	} catch (err) {
		console.warn("[LinkedIn/Apify] Sync run error:", err);
		return null;
	}
}

async function tryApifyAsync(
	linkedinUrl: string,
	token: string,
): Promise<ApifyProfile | null> {
	try {
		// 1. Start the run
		const startRes = await fetch(
			`https://api.apify.com/v2/acts/${APIFY_ACTOR_ID}/runs?token=${encodeURIComponent(token)}`,
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					profileScraperMode:
						"Profile details no email ($4 per 1k)",
					urls: [linkedinUrl],
				}),
				signal: AbortSignal.timeout(15000),
			},
		);

		if (!startRes.ok) {
			console.warn(
				`[LinkedIn/Apify] Start run returned ${startRes.status}`,
			);
			return null;
		}

		const runData = (await startRes.json()) as {
			data?: { id?: string; defaultDatasetId?: string };
		};
		const runId = runData.data?.id;
		const datasetId = runData.data?.defaultDatasetId;

		if (!runId || !datasetId) {
			console.warn("[LinkedIn/Apify] No runId/datasetId in response");
			return null;
		}

		// 2. Poll until SUCCEEDED or timeout
		const deadline = Date.now() + APIFY_MAX_WAIT;
		while (Date.now() < deadline) {
			await sleep(APIFY_POLL_INTERVAL);

			const statusRes = await fetch(
				`https://api.apify.com/v2/actor-runs/${runId}?token=${encodeURIComponent(token)}`,
				{ signal: AbortSignal.timeout(10000) },
			);

			if (!statusRes.ok) continue;

			const statusData = (await statusRes.json()) as {
				data?: { status?: string };
			};
			const status = statusData.data?.status;

			if (status === "SUCCEEDED") {
				// 3. Fetch dataset items
				const itemsRes = await fetch(
					`https://api.apify.com/v2/datasets/${datasetId}/items?token=${encodeURIComponent(token)}`,
					{ signal: AbortSignal.timeout(10000) },
				);

				if (!itemsRes.ok) return null;

				const items: ApifyProfile[] = await itemsRes.json();
				return items?.[0] ?? null;
			}

			if (status === "FAILED" || status === "ABORTED" || status === "TIMED-OUT") {
				console.warn(`[LinkedIn/Apify] Run ${status}`);
				return null;
			}
		}

		console.warn("[LinkedIn/Apify] Poll timeout");
		return null;
	} catch (err) {
		console.warn("[LinkedIn/Apify] Async run error:", err);
		return null;
	}
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Format Apify → Resume Text ─────────────────────────────────────────────

function formatApifyProfileAsResume(
	p: ApifyProfile,
	url: string,
): string {
	const lines: string[] = [];

	const fullName = [p.firstName, p.lastName].filter(Boolean).join(" ");
	if (fullName) lines.push(fullName.toUpperCase());
	if (p.headline) lines.push(p.headline);

	const contactParts: string[] = [];
	const loc = p.location?.parsed?.text || p.location?.linkedinText;
	if (loc) contactParts.push(loc);
	contactParts.push(p.linkedinUrl || url);
	lines.push(contactParts.join(" | "));
	lines.push("");

	if (p.about) {
		lines.push("SUMMARY");
		lines.push(p.about);
		lines.push("");
	}

	if (p.experience && p.experience.length > 0) {
		lines.push("EXPERIENCE");
		for (const exp of p.experience) {
			const titleLine: string[] = [];
			if (exp.position) titleLine.push(exp.position);
			if (exp.companyName) titleLine.push(exp.companyName);
			lines.push(titleLine.join(" | "));

			const meta: string[] = [];
			const dateRange = formatDateRange(exp.startDate?.text, exp.endDate?.text);
			if (dateRange) meta.push(dateRange);
			if (exp.duration) meta.push(exp.duration);
			if (exp.location) meta.push(exp.location);
			if (exp.employmentType) meta.push(exp.employmentType);
			if (meta.length > 0) lines.push(meta.join(" · "));

			if (exp.description) {
				const desc = exp.description
					.split("\n")
					.map((l) => l.trim())
					.filter(Boolean)
					.join("\n");
				lines.push(desc);
			}

			if (exp.skills && exp.skills.length > 0) {
				lines.push(`Skills: ${exp.skills.join(", ")}`);
			}
			lines.push("");
		}
	}

	if (p.education && p.education.length > 0) {
		lines.push("EDUCATION");
		for (const edu of p.education) {
			const eduLine: string[] = [];
			if (edu.schoolName) eduLine.push(edu.schoolName);
			const degreeField = [edu.degree, edu.fieldOfStudy]
				.filter(Boolean)
				.join(", ");
			if (degreeField) eduLine.push(degreeField);
			lines.push(eduLine.join(" | "));

			const period =
				edu.period ||
				formatDateRange(edu.startDate?.text, edu.endDate?.text);
			if (period) lines.push(period);
			lines.push("");
		}
	}

	if (p.certifications && p.certifications.length > 0) {
		lines.push("CERTIFICATIONS");
		for (const cert of p.certifications) {
			const certParts: string[] = [];
			if (cert.title) certParts.push(cert.title);
			if (cert.issuedBy) certParts.push(cert.issuedBy);
			lines.push(certParts.join(" | "));
			if (cert.issuedAt) lines.push(cert.issuedAt);
			lines.push("");
		}
	}

	if (p.projects && p.projects.length > 0) {
		lines.push("PROJECTS");
		for (const proj of p.projects) {
			if (proj.title) lines.push(proj.title);
			if (proj.duration) lines.push(proj.duration);
			if (proj.description) lines.push(proj.description);
			lines.push("");
		}
	}

	if (p.skills && p.skills.length > 0) {
		lines.push("SKILLS");
		const skillNames = p.skills
			.map((s) => s.name)
			.filter(Boolean) as string[];
		lines.push(skillNames.join(", "));
		lines.push("");
	}

	return lines.join("\n").trim();
}

function formatDateRange(
	start?: string,
	end?: string,
): string | null {
	if (!start && !end) return null;
	return [start, end].filter(Boolean).join(" - ");
}

// ─── Persist ─────────────────────────────────────────────────────────────────

async function saveResumeText(
	userId: string,
	resumeText: string,
	profileName: string | null,
	linkedinUrl: string | null,
) {
	const admin = supabaseAdmin();
	const resumeId = crypto.randomUUID();
	const objectPath = `resumes/${userId}/${resumeId}.txt`;

	const { error: uploadError } = await admin.storage
		.from("resumes")
		.upload(objectPath, new Blob([resumeText], { type: "text/plain" }), {
			contentType: "text/plain",
			upsert: false,
		});

	if (uploadError) {
		console.error("[LinkedIn] Storage upload error:", uploadError);
		return NextResponse.json(
			{ error: "Failed to save profile as resume" },
			{ status: 500 },
		);
	}

	const label = profileName
		? `LinkedIn - ${profileName}`
		: "LinkedIn Profile Import";

	// Clear existing default so the new import becomes the active base resume
	await admin
		.from("resume_versions")
		.update({ is_default: false })
		.eq("user_id", userId)
		.eq("is_default", true);

	const { data: resume, error: insertError } = await admin
		.from("resume_versions")
		.insert({
			id: resumeId,
			user_id: userId,
			label,
			file_name: `${profileName?.replace(/\s+/g, "_") || "linkedin_profile"}.txt`,
			file_type: "txt",
			object_path: objectPath,
			resume_text: resumeText,
			is_default: true,
		})
		.select()
		.single();

	if (insertError) {
		console.error("[LinkedIn] DB insert error:", insertError);
		await admin.storage.from("resumes").remove([objectPath]);
		return NextResponse.json(
			{ error: "Failed to save resume version" },
			{ status: 500 },
		);
	}

	return NextResponse.json({ resume, profileName });
}

function extractNameFromText(text: string): string | null {
	const firstLine = text.split("\n")[0]?.trim();
	if (firstLine && firstLine.length < 80 && !/https?:\/\//.test(firstLine)) {
		return firstLine;
	}
	return null;
}
