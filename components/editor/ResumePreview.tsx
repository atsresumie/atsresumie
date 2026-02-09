"use client";

import {
	forwardRef,
	useImperativeHandle,
	useMemo,
	useRef,
	type CSSProperties,
} from "react";
import { cn } from "@/lib/utils";
import type { EditorSettings, RenderPayload } from "./types";
import { FONT_FAMILY_OPTIONS } from "./types";

const CSS_DPI = 96;

type ResumeBlock =
	| {
			id: string;
			kind: "title";
	  }
	| {
			id: string;
			kind: "section-heading";
			sectionId: string;
			heading: string;
	  }
	| {
			id: string;
			kind: "paragraph";
			sectionId: string;
			text: string;
	  }
	| {
			id: string;
			kind: "bullets";
			sectionId: string;
			title?: string;
			subtitle?: string;
			meta?: string;
			bullets: string[];
			continued?: boolean;
	  };

interface PageMetrics {
	widthPx: number;
	heightPx: number;
	contentWidthPx: number;
	usableHeightPx: number;
	marginPx: number;
	lineHeightPx: number;
	headingFontSizePx: number;
	charsPerLine: number;
	density: {
		paragraphGap: number;
		bulletGap: number;
		headingBottomGap: number;
	};
}

const LAYOUT_DENSITY: Record<
	EditorSettings["layout"],
	PageMetrics["density"]
> = {
	compact: {
		paragraphGap: 6,
		bulletGap: 2,
		headingBottomGap: 5,
	},
	balanced: {
		paragraphGap: 8,
		bulletGap: 3,
		headingBottomGap: 7,
	},
	airy: {
		paragraphGap: 11,
		bulletGap: 4,
		headingBottomGap: 10,
	},
};

function getPageDimensionsPx(pageSize: EditorSettings["pageSize"]) {
	if (pageSize === "a4") {
		return {
			widthPx: Math.round(8.27 * CSS_DPI),
			heightPx: Math.round(11.69 * CSS_DPI),
		};
	}

	return {
		widthPx: Math.round(8.5 * CSS_DPI),
		heightPx: Math.round(11 * CSS_DPI),
	};
}

function estimatedLines(text: string, charsPerLine: number): number {
	const compacted = text.replace(/\s+/g, " ").trim();
	if (!compacted) return 0;
	return Math.max(1, Math.ceil(compacted.length / Math.max(1, charsPerLine)));
}

function buildBlocks(payload: RenderPayload): ResumeBlock[] {
	const blocks: ResumeBlock[] = [{ id: "title", kind: "title" }];

	for (const section of payload.sections) {
		blocks.push({
			id: `${section.id}-heading`,
			kind: "section-heading",
			sectionId: section.id,
			heading: section.heading,
		});

		section.items.forEach((item, itemIndex) => {
			if (item.type === "paragraph") {
				blocks.push({
					id: `${section.id}-paragraph-${itemIndex}`,
					kind: "paragraph",
					sectionId: section.id,
					text: item.text,
				});
				return;
			}

			blocks.push({
				id: `${section.id}-bullets-${itemIndex}`,
				kind: "bullets",
				sectionId: section.id,
				title: item.title,
				subtitle: item.subtitle,
				meta: item.meta,
				bullets: item.bullets,
			});
		});
	}

	return blocks;
}

function estimateBlockHeight(
	block: ResumeBlock,
	payload: RenderPayload,
	metrics: PageMetrics,
): number {
	const { lineHeightPx, headingFontSizePx, charsPerLine, density } = metrics;

	if (block.kind === "title") {
		const nameLines = estimatedLines(payload.title.name, Math.floor(charsPerLine * 0.65));
		const subtitleLines = estimatedLines(payload.title.subtitle || "", charsPerLine);
		const contactsLine = payload.title.contacts.join("  •  ");
		const contactLines = estimatedLines(contactsLine, Math.floor(charsPerLine * 0.95));

		return (
			nameLines * headingFontSizePx * 1.15 +
			subtitleLines * lineHeightPx +
			contactLines * lineHeightPx +
			14
		);
	}

	if (block.kind === "section-heading") {
		return headingFontSizePx + density.headingBottomGap + 9;
	}

	if (block.kind === "paragraph") {
		const lines = estimatedLines(block.text, charsPerLine);
		return lines * lineHeightPx + density.paragraphGap;
	}

	const headerLines = [block.title, block.subtitle, block.meta]
		.filter(Boolean)
		.map((line) => estimatedLines(line || "", Math.floor(charsPerLine * 0.9)))
		.reduce((total, lines) => total + lines, 0);
	const bulletLines = block.bullets
		.map((bullet) => estimatedLines(bullet, Math.max(20, charsPerLine - 6)))
		.reduce((total, lines) => total + lines, 0);

	return (
		headerLines * lineHeightPx +
		bulletLines * lineHeightPx +
		Math.max(0, block.bullets.length - 1) * density.bulletGap +
		density.paragraphGap +
		6
	);
}

function splitBulletBlock(
	block: Extract<ResumeBlock, { kind: "bullets" }>,
	payload: RenderPayload,
	metrics: PageMetrics,
): Array<Extract<ResumeBlock, { kind: "bullets" }>> {
	const originalHeight = estimateBlockHeight(block, payload, metrics);
	if (originalHeight <= metrics.usableHeightPx || block.bullets.length <= 1) {
		return [block];
	}

	const chunks: Array<Extract<ResumeBlock, { kind: "bullets" }>> = [];
	let currentBullets: string[] = [];

	for (const bullet of block.bullets) {
		const candidate: Extract<ResumeBlock, { kind: "bullets" }> = {
			...block,
			bullets: [...currentBullets, bullet],
			title: chunks.length === 0 ? block.title : undefined,
			subtitle: chunks.length === 0 ? block.subtitle : undefined,
			meta: chunks.length === 0 ? block.meta : undefined,
		};

		if (
			currentBullets.length > 0 &&
			estimateBlockHeight(candidate, payload, metrics) > metrics.usableHeightPx
		) {
			chunks.push({
				...block,
				id: `${block.id}-part-${chunks.length + 1}`,
				bullets: [...currentBullets],
				title: chunks.length === 0 ? block.title : undefined,
				subtitle: chunks.length === 0 ? block.subtitle : undefined,
				meta: chunks.length === 0 ? block.meta : undefined,
				continued: chunks.length > 0,
			});
			currentBullets = [bullet];
			continue;
		}

		currentBullets.push(bullet);
	}

	if (currentBullets.length > 0) {
		chunks.push({
			...block,
			id: `${block.id}-part-${chunks.length + 1}`,
			bullets: [...currentBullets],
			title: chunks.length === 0 ? block.title : undefined,
			subtitle: chunks.length === 0 ? block.subtitle : undefined,
			meta: chunks.length === 0 ? block.meta : undefined,
			continued: chunks.length > 0,
		});
	}

	return chunks.length > 0 ? chunks : [block];
}

function paginateBlocks(
	blocks: ResumeBlock[],
	payload: RenderPayload,
	metrics: PageMetrics,
): ResumeBlock[][] {
	const pages: ResumeBlock[][] = [[]];
	let usedHeight = 0;

	const startNewPage = () => {
		pages.push([]);
		usedHeight = 0;
	};

	const pushBlock = (block: ResumeBlock) => {
		const height = estimateBlockHeight(block, payload, metrics);
		if (usedHeight > 0 && usedHeight + height > metrics.usableHeightPx) {
			startNewPage();
		}
		pages[pages.length - 1].push(block);
		usedHeight += height;
	};

	for (let index = 0; index < blocks.length; index += 1) {
		const block = blocks[index];
		if (block.kind === "section-heading") {
			const nextBlock = blocks[index + 1];
			const headingHeight = estimateBlockHeight(block, payload, metrics);
			const nextHeight = nextBlock
				? estimateBlockHeight(nextBlock, payload, metrics)
				: 0;
			if (
				usedHeight > 0 &&
				usedHeight + headingHeight + nextHeight > metrics.usableHeightPx
			) {
				startNewPage();
			}
			pages[pages.length - 1].push(block);
			usedHeight += headingHeight;
			continue;
		}

		if (block.kind === "bullets") {
			const splitBlocks = splitBulletBlock(block, payload, metrics);
			splitBlocks.forEach(pushBlock);
			continue;
		}

		pushBlock(block);
	}

	return pages[0]?.length ? pages : [[]];
}

export interface ResumePreviewHandle {
	getPageElements: () => HTMLDivElement[];
	getPageCount: () => number;
}

interface ResumePreviewProps {
	payload: RenderPayload;
	settings: EditorSettings;
	className?: string;
}

export const ResumePreview = forwardRef<ResumePreviewHandle, ResumePreviewProps>(
	function ResumePreview({ payload, settings, className }, ref) {
		const pageRefs = useRef<Array<HTMLDivElement | null>>([]);
		const dimensions = useMemo(
			() => getPageDimensionsPx(settings.pageSize),
			[settings.pageSize],
		);

		const metrics = useMemo<PageMetrics>(() => {
			const marginPx = settings.marginInches * CSS_DPI;
			const contentWidthPx = dimensions.widthPx - marginPx * 2;
			const usableHeightPx = dimensions.heightPx - marginPx * 2;

			return {
				widthPx: dimensions.widthPx,
				heightPx: dimensions.heightPx,
				contentWidthPx,
				usableHeightPx,
				marginPx,
				lineHeightPx: settings.baseFontSize * settings.lineHeight,
				headingFontSizePx: settings.baseFontSize * settings.headingScale,
				charsPerLine: Math.max(
					24,
					Math.floor(contentWidthPx / (settings.baseFontSize * 0.54)),
				),
				density: LAYOUT_DENSITY[settings.layout],
			};
		}, [dimensions.heightPx, dimensions.widthPx, settings]);

		const blocks = useMemo(() => buildBlocks(payload), [payload]);
		const pages = useMemo(
			() => paginateBlocks(blocks, payload, metrics),
			[blocks, payload, metrics],
		);

		const fontFamily = useMemo(() => {
			const selectedFont = FONT_FAMILY_OPTIONS.find(
				(option) => option.value === settings.fontFamily,
			);
			return selectedFont?.fontFamily || FONT_FAMILY_OPTIONS[0].fontFamily;
		}, [settings.fontFamily]);

		useImperativeHandle(
			ref,
			() => ({
				getPageElements: () =>
					pageRefs.current.filter(
						(node): node is HTMLDivElement => Boolean(node),
					),
				getPageCount: () => pages.length,
			}),
			[pages.length],
		);

		const textStyles: CSSProperties = {
			fontFamily,
			fontSize: `${settings.baseFontSize}px`,
			lineHeight: String(settings.lineHeight),
		};

		return (
			<div
				className={cn(
					"h-full overflow-auto bg-surface-base/90 p-6 md:p-8",
					"[background-image:radial-gradient(circle_at_20%_20%,rgba(157,96,79,0.12),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.05),transparent_32%)]",
					className,
				)}
			>
				<div className="mx-auto flex min-w-max flex-col gap-8 pb-10">
					{pages.map((pageBlocks, pageIndex) => (
						<div key={`page-${pageIndex}`} className="space-y-2">
							<div className="flex items-center justify-between px-1">
								<p className="text-xs uppercase tracking-[0.14em] text-text-secondary">
									Page {pageIndex + 1}
								</p>
							</div>

							<div
								ref={(node) => {
									pageRefs.current[pageIndex] = node;
								}}
								className="relative overflow-hidden border border-[#2f2620] bg-[#f7f2e8] text-[#211d18] shadow-[0_22px_48px_rgba(0,0,0,0.35)]"
								style={{
									width: `${metrics.widthPx}px`,
									height: `${metrics.heightPx}px`,
									...textStyles,
								}}
							>
								<div
									aria-hidden="true"
									className="pointer-events-none absolute border border-dashed border-[#9d604f]/35"
									style={{
										left: `${metrics.marginPx}px`,
										top: `${metrics.marginPx}px`,
										width: `${metrics.contentWidthPx}px`,
										height: `${metrics.usableHeightPx}px`,
									}}
								/>

								<div
									className="absolute inset-0"
									style={{
										padding: `${metrics.marginPx}px`,
									}}
								>
									{pageBlocks.map((block, blockIndex) => {
										const prevBlock = pageBlocks[blockIndex - 1];
										const marginTop =
											block.kind === "section-heading"
												? blockIndex === 0
													? 0
													: settings.sectionSpacing
												: block.kind === "title"
													? 0
													: prevBlock?.kind === "section-heading"
														? 4
														: metrics.density.paragraphGap;

										if (block.kind === "title") {
											return (
												<header
													key={block.id}
													style={{ marginTop }}
													className="border-b border-[#3b332e] pb-3"
												>
													<h1
														className="font-semibold tracking-tight text-[#17120f]"
														style={{
															fontSize: `${Math.round(
																metrics.headingFontSizePx * 1.18,
															)}px`,
															lineHeight: 1.1,
														}}
													>
														{payload.title.name}
													</h1>
													{payload.title.subtitle && (
														<p className="mt-1 text-[#3a322d]">
															{payload.title.subtitle}
														</p>
													)}
													{payload.title.contacts.length > 0 && (
														<p className="mt-2 text-[0.92em] text-[#4b423c]">
															{payload.title.contacts.join("  •  ")}
														</p>
													)}
												</header>
											);
										}

										if (block.kind === "section-heading") {
											return (
												<div
													key={block.id}
													style={{ marginTop }}
													className="pb-1"
												>
													<h2
														className="font-semibold uppercase tracking-[0.08em] text-[#201912]"
														style={{
															fontSize: `${Math.round(metrics.headingFontSizePx)}px`,
															lineHeight: 1.1,
														}}
													>
														{block.heading}
													</h2>
													<div className="mt-1 h-px bg-[#574a42]/70" />
												</div>
											);
										}

										if (block.kind === "paragraph") {
											return (
												<p
													key={block.id}
													style={{ marginTop }}
													className="text-[#2a221d]"
												>
													{block.text}
												</p>
											);
										}

										return (
											<div key={block.id} style={{ marginTop }}>
												{block.title && (
													<p className="font-semibold text-[#241d17]">
														{block.title}
													</p>
												)}
												{block.subtitle && (
													<p className="text-[#3b332d]">{block.subtitle}</p>
												)}
												{block.meta && (
													<p className="text-[0.9em] text-[#4e443e]">{block.meta}</p>
												)}
												{block.continued && (
													<p className="mb-1 text-[0.84em] uppercase tracking-[0.08em] text-[#645850]">
														Continued
													</p>
												)}
												<ul
													className="list-disc pl-5 text-[#2a221d]"
													style={{
														rowGap: `${metrics.density.bulletGap}px`,
														display: "grid",
													}}
												>
													{block.bullets.map((bullet, bulletIndex) => (
														<li key={`${block.id}-bullet-${bulletIndex}`}>{bullet}</li>
													))}
												</ul>
											</div>
										);
									})}
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		);
	},
);
