"use client";

import { useMemo } from "react";
import { FileText, Eye } from "lucide-react";
import { ResumeContent } from "@/components/editor/ResumeContent";
import type { RenderPayload, ResumeSectionItem } from "@/types/editor";
import { DEFAULT_EDITOR_SETTINGS, PAGE_DIMENSIONS } from "@/types/editor";
import "@/styles/latex-resume.css";
import { cn } from "@/lib/utils";

const MM_TO_PX = 96 / 25.4;

interface ResumePreviewCardProps {
	resumeText: string | null;
	label?: string;
	/** Target width in CSS pixels for the scaled page (sidebar ~280, modal ~480) */
	previewWidthPx?: number;
	/** Shown when `resumeText` is empty (e.g. selected resume has no extracted text) */
	emptyHint?: string;
	className?: string;
	/** Hide the card title row (e.g. when used inside a dialog that already has a title) */
	hideHeader?: boolean;
	/** Center the page preview horizontally (e.g. in a modal) */
	centerPreview?: boolean;
}

/**
 * Read-only PDF-canvas-style preview of a resume's text content.
 * Parses plain text into structured RenderPayload and renders it
 * using the existing LaTeX-matching CSS on a letter-sized page.
 */
export function ResumePreviewCard({
	resumeText,
	label,
	previewWidthPx = 280,
	emptyHint,
	className,
	hideHeader = false,
	centerPreview = false,
}: ResumePreviewCardProps) {
	const payload = useMemo(
		() => (resumeText ? parseResumeText(resumeText) : null),
		[resumeText],
	);

	if (!resumeText || !payload) {
		return (
			<div
				className={cn(
					"rounded-xl border border-border-visible bg-surface-raised p-6",
					centerPreview && "w-full flex flex-col items-center",
					className,
				)}
			>
				{!hideHeader && (
					<div className="flex items-center gap-2 mb-3">
						<Eye size={16} className="text-text-tertiary" />
						<h3 className="text-sm font-semibold text-text-primary font-body">
							Resume Preview
						</h3>
					</div>
				)}
				<div className="flex flex-col items-center justify-center py-10 text-text-tertiary">
					<FileText size={32} className="mb-2 opacity-40" />
					<p className="text-sm text-center px-2">
						{emptyHint ?? "Select a resume to preview"}
					</p>
				</div>
			</div>
		);
	}

	const settings = DEFAULT_EDITOR_SETTINGS;
	const dimensions = PAGE_DIMENSIONS[settings.pageSize];
	const pageWidth = dimensions.width * MM_TO_PX;
	const pageHeight = dimensions.height * MM_TO_PX;
	const scale = previewWidthPx / pageWidth;

	return (
		<div
			className={cn(
				"rounded-xl border border-border-visible bg-surface-raised p-4",
				className,
			)}
		>
			{!hideHeader && (
				<div className="flex items-center gap-2 mb-3">
					<Eye size={16} className="text-text-tertiary" />
					<h3 className="text-sm font-semibold text-text-primary font-body">
						{label || "Resume Preview"}
					</h3>
				</div>
			)}

			<div
				className={cn(
					"rounded-lg border border-border-visible bg-neutral-100 dark:bg-neutral-900 p-2",
					centerPreview && "flex justify-center",
				)}
			>
				{/*
					Do not set a fixed height on the scaled wrapper — that clips
					multi-page-length resumes. Let height follow content; the modal
					scroll container handles overflow.
				*/}
				<div
					className="origin-top-left shrink-0"
					style={{
						width: pageWidth,
						transform: `scale(${scale})`,
						transformOrigin: "top left",
					}}
				>
					<div
						className="bg-white rounded-md shadow-sm"
						style={{
							width: pageWidth,
							minHeight: pageHeight,
							padding: `${settings.marginTop * MM_TO_PX}px ${settings.marginRight * MM_TO_PX}px ${settings.marginBottom * MM_TO_PX}px ${settings.marginLeft * MM_TO_PX}px`,
						}}
					>
						<ResumeContent payload={payload} settings={settings} />
					</div>
				</div>
			</div>
		</div>
	);
}

// ─── Plain text → RenderPayload parser ───────────────────────────────────────

const KNOWN_HEADINGS = new Set([
	"SUMMARY",
	"EXPERIENCE",
	"EDUCATION",
	"SKILLS",
	"CERTIFICATIONS",
	"PROJECTS",
	"VOLUNTEERING",
	"AWARDS",
	"PUBLICATIONS",
	"LANGUAGES",
	"INTERESTS",
	"OBJECTIVE",
	"PROFESSIONAL SUMMARY",
	"WORK EXPERIENCE",
	"TECHNICAL SKILLS",
	"PROFESSIONAL EXPERIENCE",
]);

function isHeading(line: string): boolean {
	const upper = line.toUpperCase().trim();
	return KNOWN_HEADINGS.has(upper);
}

function parseResumeText(text: string): RenderPayload {
	const lines = text.split("\n");

	let name = "";
	let subtitle: string | undefined;
	const contacts: string[] = [];
	const sections: RenderPayload["sections"] = [];

	let i = 0;

	while (i < lines.length) {
		const line = lines[i].trim();
		if (!line) {
			i++;
			continue;
		}
		if (!name) {
			name = line;
			i++;
			continue;
		}
		if (isHeading(line)) break;

		if (
			line.includes("|") ||
			line.includes("@") ||
			line.includes("linkedin") ||
			line.includes("github") ||
			line.includes("http")
		) {
			const parts = line
				.split("|")
				.map((p) => p.trim())
				.filter(Boolean);
			contacts.push(...parts);
		} else {
			if (!subtitle) {
				subtitle = line;
			} else {
				contacts.push(line);
			}
		}
		i++;
	}

	let currentHeading: string | null = null;
	let currentItems: ResumeSectionItem[] = [];
	let currentEntry: {
		title?: string;
		subtitle?: string;
		meta?: string;
		bullets: string[];
	} | null = null;

	const flushEntry = () => {
		if (currentEntry) {
			if (currentEntry.bullets.length > 0 || currentEntry.title) {
				currentItems.push({
					type: "bullets",
					title: currentEntry.title,
					subtitle: currentEntry.subtitle,
					meta: currentEntry.meta,
					bullets: currentEntry.bullets,
				});
			}
			currentEntry = null;
		}
	};

	const flushSection = () => {
		flushEntry();
		if (currentHeading && currentItems.length > 0) {
			sections.push({
				id: currentHeading.toLowerCase().replace(/\s+/g, "-"),
				heading: currentHeading,
				items: currentItems,
			});
		}
		currentItems = [];
	};

	while (i < lines.length) {
		const line = lines[i].trim();
		i++;

		if (!line) {
			flushEntry();
			continue;
		}

		if (isHeading(line)) {
			flushSection();
			currentHeading = line.toUpperCase();
			continue;
		}

		if (!currentHeading) continue;

		const headingUpper = currentHeading.toUpperCase();

		if (headingUpper === "SKILLS" || headingUpper === "TECHNICAL SKILLS") {
			currentItems.push({ type: "paragraph", text: line });
			continue;
		}

		if (line.startsWith("*") || line.startsWith("-") || line.startsWith("•")) {
			if (!currentEntry) {
				currentEntry = { bullets: [] };
			}
			currentEntry.bullets.push(
				line.replace(/^[\*\-•]\s*/, "").trim(),
			);
			continue;
		}

		if (line.startsWith("Skills:") && currentEntry) {
			currentEntry.bullets.push(line);
			continue;
		}

		if (line.includes("|")) {
			flushEntry();
			const parts = line.split("|").map((p) => p.trim());
			currentEntry = {
				title: parts[0] || undefined,
				subtitle: parts[1] || undefined,
				bullets: [],
			};
			continue;
		}

		if (/\d{4}|present|current/i.test(line) && line.length < 100) {
			if (currentEntry) {
				currentEntry.meta = line;
			} else {
				currentEntry = { meta: line, bullets: [] };
			}
			continue;
		}

		if (!currentEntry) {
			currentEntry = { title: line, bullets: [] };
		} else if (!currentEntry.subtitle && !currentEntry.title) {
			currentEntry.title = line;
		} else {
			currentEntry.bullets.push(line);
		}
	}

	flushSection();

	return {
		title: { name, subtitle, contacts },
		sections,
	};
}
