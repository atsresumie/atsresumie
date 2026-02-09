import type { RenderPayload } from "./types";

const HEADING_ALIASES: Record<string, string> = {
	summary: "Summary",
	profile: "Summary",
	objective: "Summary",
	experience: "Experience",
	workexperience: "Experience",
	professionalexperience: "Experience",
	education: "Education",
	skills: "Skills",
	technicalskills: "Skills",
	projects: "Projects",
	certifications: "Certifications",
	certification: "Certifications",
	awards: "Awards",
	achievements: "Achievements",
	volunteerexperience: "Volunteer Experience",
};

const BULLET_REGEX = /^\s*(?:[-*•●◦▪]|\d+[.)])\s+/;

function normalizeLine(line: string): string {
	return line.replace(/\u00a0/g, " ").replace(/\t/g, " ").trim();
}

function normalizeHeadingKey(line: string): string {
	return line.toLowerCase().replace(/[^a-z]/g, "");
}

function isLikelySectionHeading(line: string): string | null {
	const normalized = normalizeLine(line);
	if (!normalized) return null;

	const alias = HEADING_ALIASES[normalizeHeadingKey(normalized)];
	if (alias) return alias;

	const uppercaseRatio =
		normalized.split("").filter((char) => /[A-Z]/.test(char)).length /
		Math.max(1, normalized.split("").filter((char) => /[A-Za-z]/.test(char)).length);
	const wordCount = normalized.split(/\s+/).length;
	if (
		uppercaseRatio > 0.85 &&
		wordCount <= 4 &&
		wordCount >= 1 &&
		normalized.length <= 30
	) {
		return normalized
			.toLowerCase()
			.replace(/\b\w/g, (match) => match.toUpperCase());
	}

	return null;
}

function splitContacts(line: string): string[] {
	return line
		.split(/\s*[|•·]\s*|\s{2,}|\s*,\s*/)
		.map((entry) => entry.trim())
		.filter(Boolean);
}

function isLikelyName(line: string): boolean {
	if (!line || line.length < 2 || line.length > 60) return false;
	if (/[0-9@]/.test(line)) return false;

	const wordCount = line.split(/\s+/).length;
	return wordCount >= 2 && wordCount <= 5;
}

function isLikelySubtitle(line: string): boolean {
	if (!line) return false;
	if (/@|https?:\/\//i.test(line)) return false;
	if (/\d{3}/.test(line)) return false;
	return line.length <= 80;
}

function parseSectionItems(lines: string[]) {
	const items: RenderPayload["sections"][number]["items"] = [];
	let currentParagraph: string[] = [];
	let currentBullets: string[] = [];
	let bulletHeader: string[] = [];

	const flushParagraph = () => {
		if (currentParagraph.length === 0) return;
		items.push({
			type: "paragraph",
			text: currentParagraph.join(" ").replace(/\s+/g, " ").trim(),
		});
		currentParagraph = [];
	};

	const flushBullets = () => {
		if (currentBullets.length === 0) return;
		items.push({
			type: "bullets",
			title: bulletHeader[0],
			subtitle: bulletHeader[1],
			meta:
				bulletHeader.length > 2
					? bulletHeader.slice(2).join(" | ")
					: undefined,
			bullets: [...currentBullets],
		});
		currentBullets = [];
		bulletHeader = [];
	};

	for (const rawLine of lines) {
		const line = normalizeLine(rawLine);
		if (!line) {
			flushParagraph();
			flushBullets();
			continue;
		}

		const isBulletLine = BULLET_REGEX.test(line);
		if (isBulletLine) {
			if (currentParagraph.length > 0 && currentBullets.length === 0) {
				const buffered = currentParagraph.join(" ").trim();
				if (buffered) {
					const headerParts = buffered
						.split(/\s*[|–-]\s*/)
						.map((part) => part.trim())
						.filter(Boolean)
						.slice(0, 3);
					bulletHeader = headerParts;
				}
				currentParagraph = [];
			}

			currentBullets.push(line.replace(BULLET_REGEX, "").trim());
			continue;
		}

		if (currentBullets.length > 0) {
			flushBullets();
		}

		currentParagraph.push(line);
	}

	flushParagraph();
	flushBullets();

	return items.filter((item) => {
		if (item.type === "paragraph") return item.text.length > 0;
		return item.bullets.length > 0;
	});
}

function inferSectionsFromText(resumeText: string): RenderPayload["sections"] {
	const rawLines = resumeText.split(/\r?\n/);
	const sections: Array<{
		heading: string;
		lines: string[];
	}> = [];

	let currentHeading = "Experience";
	let currentLines: string[] = [];

	for (const rawLine of rawLines) {
		const heading = isLikelySectionHeading(rawLine);
		if (heading) {
			if (currentLines.some((line) => normalizeLine(line).length > 0)) {
				sections.push({
					heading: currentHeading,
					lines: [...currentLines],
				});
			}
			currentHeading = heading;
			currentLines = [];
			continue;
		}
		currentLines.push(rawLine);
	}

	if (currentLines.some((line) => normalizeLine(line).length > 0)) {
		sections.push({
			heading: currentHeading,
			lines: currentLines,
		});
	}

	if (sections.length === 0) {
		return [
			{
				id: "section-overview",
				heading: "Overview",
				items: parseSectionItems(rawLines),
			},
		];
	}

	return sections.map((section, index) => {
		const items = parseSectionItems(section.lines);
		return {
			id: `section-${index}-${normalizeHeadingKey(section.heading) || "untitled"}`,
			heading: section.heading,
			items:
				items.length > 0
					? items
					: [{ type: "paragraph", text: section.lines.join(" ") }],
		};
	});
}

function deriveTitleBlock(resumeText: string, jdText: string | null | undefined) {
	const lines = resumeText
		.split(/\r?\n/)
		.map((line) => normalizeLine(line))
		.filter(Boolean);

	const fallbackName = "ATSResumie Candidate";
	let name = fallbackName;
	let subtitle: string | undefined;
	const contacts: string[] = [];

	if (lines.length > 0 && isLikelyName(lines[0])) {
		name = lines[0];
	}

	for (let index = name === fallbackName ? 0 : 1; index < lines.length; index += 1) {
		const line = lines[index];
		if (isLikelySectionHeading(line)) break;

		if (!subtitle && isLikelySubtitle(line)) {
			subtitle = line;
			continue;
		}

		for (const contact of splitContacts(line)) {
			if (contacts.length >= 4) break;
			if (!contacts.includes(contact) && contact.length <= 80) {
				contacts.push(contact);
			}
		}

		if (contacts.length >= 4) break;
	}

	if (!subtitle && jdText) {
		const firstLine = normalizeLine(jdText.split(/\r?\n/)[0] || "");
		if (firstLine && firstLine.length <= 80) {
			subtitle = `Targeting: ${firstLine}`;
		}
	}

	return { name, subtitle, contacts };
}

export function deriveRenderPayloadFromResumeText(
	resumeText: string,
	jdText?: string | null,
): RenderPayload {
	const normalizedText = resumeText.trim();
	if (!normalizedText) {
		return {
			title: {
				name: "ATSResumie Candidate",
				contacts: [],
			},
			sections: [
				{
					id: "section-empty",
					heading: "Overview",
					items: [
						{
							type: "paragraph",
							text: "No resume content available for this generation.",
						},
					],
				},
			],
		};
	}

	return {
		title: deriveTitleBlock(normalizedText, jdText),
		sections: inferSectionsFromText(normalizedText),
	};
}
