import { NextRequest, NextResponse } from "next/server";

const APIFY_ACTOR_ID = "apify~website-content-crawler";
const APIFY_RUN_URL = `https://api.apify.com/v2/acts/${APIFY_ACTOR_ID}/run-sync-get-dataset-items`;
const APIFY_ASYNC_URL = `https://api.apify.com/v2/acts/${APIFY_ACTOR_ID}/runs`;
const APIFY_POLL_INTERVAL = 3000;
const APIFY_MAX_WAIT = 60000;

/**
 * POST /api/jobs/scrape
 *
 * Fetches a job posting URL and extracts readable content.
 * Falls back to Apify website-content-crawler when direct fetch is blocked.
 * Returns: { title, description, company, location, salary, source, fetchFailed }
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

		const source = parsedUrl.hostname.replace("www.", "");

		// Check if we got a usable description from the direct fetch
		const directDescription =
			jsonLd?.description ||
			meta.ogDescription ||
			meta.description ||
			mainContent ||
			null;

		// ── Apify fallback: if direct fetch failed or returned no useful content ──
		let apifyText: string | null = null;
		let apifyTitle: string | null = null;

		if (!directDescription && (fetchFailed || !html)) {
			const token = process.env.LINKEDIN_TOKEN;
			if (token) {
				console.log(`[jobs/scrape] Direct fetch failed for ${source}, trying Apify crawler...`);
				const crawled = await crawlViaApify(parsedUrl.toString(), token);
				if (crawled) {
					apifyText = crawled.text;
					apifyTitle = crawled.title;
					fetchFailed = false; // Apify succeeded
					console.log(`[jobs/scrape] Apify crawler returned ${apifyText?.length || 0} chars for ${source}`);
				} else {
					console.warn(`[jobs/scrape] Apify crawler also failed for ${source}`);
				}
			} else {
				console.warn("[jobs/scrape] No LINKEDIN_TOKEN for Apify fallback");
			}
		}

		// Build result — prefer direct parse, fall back to Apify text
		const result = {
			title: jsonLd?.title || meta.ogTitle || meta.title || apifyTitle || null,
			company:
				jsonLd?.hiringOrganization ||
				meta.ogSiteName ||
				source,
			location: jsonLd?.jobLocation || null,
			salary: jsonLd?.baseSalary || null,
			employmentType: jsonLd?.employmentType || null,
			description:
				directDescription ||
				apifyText ||
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

// ─── Apify Website Content Crawler ───────────────────────────────────────────

interface ApifyCrawlResult {
	text: string | null;
	title: string | null;
}

// Error page patterns that indicate the crawler was blocked
const BLOCKED_PATTERNS = [
	"error code: 403",
	"can't open this page",
	"access denied",
	"please verify you are a human",
	"enable javascript",
	"captcha",
	"blocked",
	"forbidden",
];

/**
 * Check if Apify-crawled text is an error/block page, not real content.
 */
function isBlockedContent(text: string | null | undefined): boolean {
	if (!text || text.length < 100) return true;
	const lower = text.toLowerCase();
	return BLOCKED_PATTERNS.some((p) => lower.includes(p));
}

/**
 * Crawl a single URL via Apify website-content-crawler.
 * Uses Chrome with residential proxies to bypass bot detection.
 * Tries sync endpoint first, falls back to async polling.
 */
async function crawlViaApify(
	targetUrl: string,
	token: string,
): Promise<ApifyCrawlResult | null> {
	const input = {
		startUrls: [{ url: targetUrl }],
		maxCrawlPages: 1,
		maxCrawlDepth: 0,
		crawlerType: "playwright:chrome",
		proxyConfiguration: {
			useApifyProxy: true,
			apifyProxyGroups: ["RESIDENTIAL"],
		},
	};

	// Try sync endpoint first (fastest path)
	const syncResult = await tryApifySync(input, token);
	if (syncResult && !isBlockedContent(syncResult.text)) return syncResult;

	// If sync returned a blocked page, retry won't help — bail
	if (syncResult) {
		console.warn("[jobs/scrape/apify] Crawler returned a blocked/error page");
		return null;
	}

	// Fallback: start run, then poll until done
	const asyncResult = await tryApifyAsync(input, token);
	if (asyncResult && isBlockedContent(asyncResult.text)) {
		console.warn("[jobs/scrape/apify] Async crawler returned a blocked/error page");
		return null;
	}
	return asyncResult;
}

async function tryApifySync(
	input: object,
	token: string,
): Promise<ApifyCrawlResult | null> {
	try {
		const response = await fetch(
			`${APIFY_RUN_URL}?token=${encodeURIComponent(token)}`,
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(input),
				signal: AbortSignal.timeout(APIFY_MAX_WAIT),
			},
		);

		if (!response.ok) {
			console.warn(`[jobs/scrape/apify] Sync run returned ${response.status}`);
			return null;
		}

		const items = await response.json() as Array<{ text?: string; title?: string }>;
		if (!items?.[0]) return null;

		return {
			text: items[0].text?.trim() || null,
			title: items[0].title?.trim() || null,
		};
	} catch (err) {
		console.warn("[jobs/scrape/apify] Sync run error:", err);
		return null;
	}
}

async function tryApifyAsync(
	input: object,
	token: string,
): Promise<ApifyCrawlResult | null> {
	try {
		// 1. Start the run
		const startRes = await fetch(
			`${APIFY_ASYNC_URL}?token=${encodeURIComponent(token)}`,
			{
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(input),
				signal: AbortSignal.timeout(15000),
			},
		);

		if (!startRes.ok) {
			console.warn(`[jobs/scrape/apify] Start run returned ${startRes.status}`);
			return null;
		}

		const runData = (await startRes.json()) as {
			data?: { id?: string; defaultDatasetId?: string };
		};
		const runId = runData.data?.id;
		const datasetId = runData.data?.defaultDatasetId;

		if (!runId || !datasetId) {
			console.warn("[jobs/scrape/apify] No runId/datasetId in response");
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

				const items = await itemsRes.json() as Array<{ text?: string; title?: string }>;
				if (!items?.[0]) return null;

				return {
					text: items[0].text?.trim() || null,
					title: items[0].title?.trim() || null,
				};
			}

			if (status === "FAILED" || status === "ABORTED" || status === "TIMED-OUT") {
				console.warn(`[jobs/scrape/apify] Run ${status}`);
				return null;
			}
		}

		console.warn("[jobs/scrape/apify] Poll timeout");
		return null;
	} catch (err) {
		console.warn("[jobs/scrape/apify] Async run error:", err);
		return null;
	}
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
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
