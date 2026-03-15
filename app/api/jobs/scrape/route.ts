import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/jobs/scrape
 *
 * Fetches a job posting URL and extracts readable content.
 * Returns: { title, description, company, location, salary, raw }
 */
export async function POST(req: NextRequest) {
	try {
		const { url } = await req.json();

		if (!url || typeof url !== "string") {
			return NextResponse.json(
				{ error: "URL is required" },
				{ status: 400 },
			);
		}

		// Validate URL
		let parsedUrl: URL;
		try {
			parsedUrl = new URL(url);
		} catch {
			return NextResponse.json(
				{ error: "Invalid URL" },
				{ status: 400 },
			);
		}

		// Full browser-like headers to avoid blocks from Indeed, LinkedIn, etc.
		const headers: Record<string, string> = {
			"User-Agent":
				"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
			Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
			"Accept-Language": "en-US,en;q=0.9",
			"Accept-Encoding": "identity",
			"Cache-Control": "no-cache",
			Pragma: "no-cache",
			"Sec-Ch-Ua": '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
			"Sec-Ch-Ua-Mobile": "?0",
			"Sec-Ch-Ua-Platform": '"macOS"',
			"Sec-Fetch-Dest": "document",
			"Sec-Fetch-Mode": "navigate",
			"Sec-Fetch-Site": "none",
			"Sec-Fetch-User": "?1",
			"Upgrade-Insecure-Requests": "1",
			Referer: `https://${parsedUrl.hostname}/`,
		};

		let html: string | null = null;
		let fetchFailed = false;

		try {
			const response = await fetch(parsedUrl.toString(), {
				headers,
				redirect: "follow",
				signal: AbortSignal.timeout(15000),
			});

			if (response.ok) {
				html = await response.text();
			} else {
				console.warn(`[jobs/scrape] Fetch returned ${response.status} for ${parsedUrl.hostname}`);
				fetchFailed = true;
			}
		} catch (fetchErr) {
			console.warn("[jobs/scrape] Fetch error:", fetchErr);
			fetchFailed = true;
		}

		// If we got HTML, parse it
		let jsonLd: JsonLdJob | null = null;
		let meta: Record<string, string | null> = {};
		let mainContent: string | null = null;

		if (html) {
			jsonLd = extractJsonLd(html);
			meta = extractMeta(html);
			mainContent = extractMainContent(html);
		}

		// Build result — always return something useful
		const source = parsedUrl.hostname.replace("www.", "");
		const result = {
			title: jsonLd?.title || meta.ogTitle || meta.title || null,
			company:
				jsonLd?.hiringOrganization ||
				meta.ogSiteName ||
				source,
			location: jsonLd?.jobLocation || null,
			salary: jsonLd?.baseSalary || null,
			employmentType: jsonLd?.employmentType || null,
			description:
				jsonLd?.description ||
				meta.ogDescription ||
				meta.description ||
				mainContent ||
				(fetchFailed
					? `This job posting is hosted on ${source}. The site blocked direct access, so we can't display the full description here.\n\nClick "View Posting" below to see the full job details on ${source}.`
					: null),
			source,
			fetchFailed,
		};

		return NextResponse.json(result);
	} catch (error) {
		console.error("[jobs/scrape] Error:", error);

		// Even on total failure, return partial info
		return NextResponse.json({
			title: null,
			company: null,
			location: null,
			salary: null,
			employmentType: null,
			description: "Could not fetch this job posting. Click below to view it directly.",
			source: null,
			fetchFailed: true,
			error: error instanceof Error ? error.message : "Unknown error",
		});
	}
}

// ─── Extractors ──────────────────────────────────────────────────────────────

interface JsonLdJob {
	title: string | null;
	description: string | null;
	hiringOrganization: string | null;
	jobLocation: string | null;
	baseSalary: string | null;
	employmentType: string | null;
}

function extractJsonLd(html: string): JsonLdJob | null {
	// Look for JobPosting JSON-LD
	const jsonLdRegex =
		/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
	let match;

	while ((match = jsonLdRegex.exec(html)) !== null) {
		try {
			const data = JSON.parse(match[1]);
			const jobs = Array.isArray(data) ? data : [data];

			for (const item of jobs) {
				const jobPosting =
					item["@type"] === "JobPosting"
						? item
						: item["@graph"]?.find(
								(n: Record<string, string>) =>
									n["@type"] === "JobPosting",
							);

				if (jobPosting) {
					return {
						title: jobPosting.title || null,
						description: stripHtml(
							jobPosting.description || "",
						),
						hiringOrganization:
							typeof jobPosting.hiringOrganization === "string"
								? jobPosting.hiringOrganization
								: jobPosting.hiringOrganization?.name || null,
						jobLocation: formatLocation(
							jobPosting.jobLocation,
						),
						baseSalary: formatSalary(jobPosting.baseSalary),
						employmentType: jobPosting.employmentType || null,
					};
				}
			}
		} catch {
			// Invalid JSON, skip
		}
	}

	return null;
}

function extractMeta(html: string): Record<string, string | null> {
	const get = (name: string): string | null => {
		const regex = new RegExp(
			`<meta[^>]*(?:property|name)=["']${name}["'][^>]*content=["']([^"']*)["']`,
			"i",
		);
		const alt = new RegExp(
			`<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${name}["']`,
			"i",
		);
		return regex.exec(html)?.[1] || alt.exec(html)?.[1] || null;
	};

	const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);

	return {
		title: titleMatch?.[1]?.trim() || null,
		ogTitle: get("og:title"),
		ogDescription: get("og:description"),
		ogSiteName: get("og:site_name"),
		description: get("description"),
	};
}

function extractMainContent(html: string): string | null {
	// Remove scripts, styles, nav, header, footer
	let cleaned = html
		.replace(/<script[\s\S]*?<\/script>/gi, "")
		.replace(/<style[\s\S]*?<\/style>/gi, "")
		.replace(/<nav[\s\S]*?<\/nav>/gi, "")
		.replace(/<header[\s\S]*?<\/header>/gi, "")
		.replace(/<footer[\s\S]*?<\/footer>/gi, "");

	// Try to find main/article content
	const mainMatch =
		cleaned.match(/<main[\s\S]*?<\/main>/i) ||
		cleaned.match(/<article[\s\S]*?<\/article>/i) ||
		cleaned.match(
			/<div[^>]*class=["'][^"']*(?:job|posting|description|content)[^"']*["'][\s\S]*?<\/div>/i,
		);

	const content = mainMatch ? mainMatch[0] : cleaned;

	// Convert to readable text
	let text = content
		// Convert headers to markdown-style
		.replace(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi, "\n\n## $1\n\n")
		// Convert lists
		.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, "• $1\n")
		// Convert paragraphs and divs to newlines
		.replace(/<\/?(p|div|br|tr)[^>]*>/gi, "\n")
		// Remove remaining tags
		.replace(/<[^>]+>/g, "")
		// Decode entities
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&nbsp;/g, " ")
		// Clean whitespace
		.replace(/\n{3,}/g, "\n\n")
		.trim();

	// Limit length
	if (text.length > 5000) {
		text = text.slice(0, 5000) + "\n\n[Content truncated...]";
	}

	return text || null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
	return html
		.replace(/<br\s*\/?>/gi, "\n")
		.replace(/<\/?(p|div|li|h[1-6])[^>]*>/gi, "\n")
		.replace(/<[^>]+>/g, "")
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&nbsp;/g, " ")
		.replace(/\n{3,}/g, "\n\n")
		.trim();
}

function formatLocation(loc: unknown): string | null {
	if (!loc) return null;
	if (typeof loc === "string") return loc;
	if (Array.isArray(loc)) {
		return loc
			.map((l) => formatLocation(l))
			.filter(Boolean)
			.join("; ");
	}
	if (typeof loc === "object" && loc !== null) {
		const l = loc as Record<string, unknown>;
		const parts = [];
		if (l.address) {
			const addr = l.address as Record<string, string>;
			if (addr.addressLocality) parts.push(addr.addressLocality);
			if (addr.addressRegion) parts.push(addr.addressRegion);
			if (addr.addressCountry) parts.push(addr.addressCountry);
		}
		return parts.join(", ") || null;
	}
	return null;
}

function formatSalary(salary: unknown): string | null {
	if (!salary) return null;
	if (typeof salary === "string") return salary;
	if (typeof salary === "object" && salary !== null) {
		const s = salary as Record<string, unknown>;
		const value = s.value as Record<string, unknown> | undefined;
		if (value) {
			const currency = (s.currency as string) || "";
			const min = value.minValue;
			const max = value.maxValue;
			if (min && max) return `${currency} ${min} - ${max}`;
			if (value.value) return `${currency} ${value.value}`;
		}
	}
	return null;
}
