"use client";

import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import {
	type StyleConfig,
	type PageSize,
	type LaTeXFontFamily,
	PAGE_SIZE_OPTIONS,
	LATEX_FONT_OPTIONS,
} from "@/types/editor";

interface StyleControlsProps {
	config: StyleConfig;
	onChange: (config: StyleConfig) => void;
	onReset: () => void;
}

/**
 * Style controls panel for PDF editor.
 * Matches Résumé Atelier design: dark matte, hairline rules, terracotta accent.
 */
export function StyleControls({
	config,
	onChange,
	onReset,
}: StyleControlsProps) {
	const updateConfig = <K extends keyof StyleConfig>(
		key: K,
		value: StyleConfig[K],
	) => {
		onChange({ ...config, [key]: value });
	};

	return (
		<div className="flex h-full flex-col">
			{/* Header */}
			<div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
				<h2 className="text-sm font-semibold uppercase tracking-wide text-text-secondary">
					Formatting
				</h2>
				<Button
					variant="ghost"
					size="sm"
					onClick={onReset}
					className="h-7 gap-1.5 px-2 text-xs text-text-tertiary hover:text-text-primary"
				>
					<RotateCcw className="h-3 w-3" />
					Reset
				</Button>
			</div>

			{/* Controls */}
			<div className="flex-1 space-y-6 overflow-y-auto p-4">
				{/* Page Size */}
				<section className="space-y-3">
					<h3 className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
						Page
					</h3>
					<div className="space-y-2">
						<Label htmlFor="pageSize" className="text-sm">
							Page Size
						</Label>
						<Select
							value={config.pageSize}
							onValueChange={(v) =>
								updateConfig("pageSize", v as PageSize)
							}
						>
							<SelectTrigger id="pageSize" className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{PAGE_SIZE_OPTIONS.map((opt) => (
									<SelectItem
										key={opt.value}
										value={opt.value}
									>
										{opt.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</section>

				<hr className="border-border-subtle" />

				{/* Margins */}
				<section className="space-y-3">
					<h3 className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
						Margins (mm)
					</h3>
					<div className="grid grid-cols-2 gap-3">
						{/* Top */}
						<div className="space-y-1.5">
							<div className="flex items-center justify-between">
								<span className="text-xs text-text-tertiary">
									Top
								</span>
								<span className="text-xs tabular-nums text-text-secondary">
									{config.marginTopMm}
								</span>
							</div>
							<Slider
								min={5}
								max={40}
								step={1}
								value={[config.marginTopMm]}
								onValueChange={([v]) =>
									updateConfig("marginTopMm", v)
								}
							/>
						</div>
						{/* Bottom */}
						<div className="space-y-1.5">
							<div className="flex items-center justify-between">
								<span className="text-xs text-text-tertiary">
									Bottom
								</span>
								<span className="text-xs tabular-nums text-text-secondary">
									{config.marginBottomMm}
								</span>
							</div>
							<Slider
								min={5}
								max={40}
								step={1}
								value={[config.marginBottomMm]}
								onValueChange={([v]) =>
									updateConfig("marginBottomMm", v)
								}
							/>
						</div>
						{/* Left */}
						<div className="space-y-1.5">
							<div className="flex items-center justify-between">
								<span className="text-xs text-text-tertiary">
									Left
								</span>
								<span className="text-xs tabular-nums text-text-secondary">
									{config.marginLeftMm}
								</span>
							</div>
							<Slider
								min={5}
								max={40}
								step={1}
								value={[config.marginLeftMm]}
								onValueChange={([v]) =>
									updateConfig("marginLeftMm", v)
								}
							/>
						</div>
						{/* Right */}
						<div className="space-y-1.5">
							<div className="flex items-center justify-between">
								<span className="text-xs text-text-tertiary">
									Right
								</span>
								<span className="text-xs tabular-nums text-text-secondary">
									{config.marginRightMm}
								</span>
							</div>
							<Slider
								min={5}
								max={40}
								step={1}
								value={[config.marginRightMm]}
								onValueChange={([v]) =>
									updateConfig("marginRightMm", v)
								}
							/>
						</div>
					</div>
				</section>

				<hr className="border-border-subtle" />

				{/* Typography */}
				<section className="space-y-3">
					<h3 className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
						Typography
					</h3>

					{/* Font Family */}
					<div className="space-y-2">
						<Label htmlFor="fontFamily" className="text-sm">
							Font Family
						</Label>
						<Select
							value={config.fontFamily}
							onValueChange={(v) =>
								updateConfig("fontFamily", v as LaTeXFontFamily)
							}
						>
							<SelectTrigger id="fontFamily" className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<div className="px-2 py-1 text-[10px] font-medium uppercase tracking-widest text-text-tertiary">
									Sans-Serif
								</div>
								{LATEX_FONT_OPTIONS.filter(
									(o) => o.category === "sans-serif",
								).map((opt) => (
									<SelectItem
										key={opt.value}
										value={opt.value}
									>
										{opt.label}
									</SelectItem>
								))}
								<div className="px-2 py-1 text-[10px] font-medium uppercase tracking-widest text-text-tertiary">
									Serif
								</div>
								{LATEX_FONT_OPTIONS.filter(
									(o) => o.category === "serif",
								).map((opt) => (
									<SelectItem
										key={opt.value}
										value={opt.value}
									>
										{opt.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Font Size */}
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label htmlFor="baseFontSize" className="text-sm">
								Font Size
							</Label>
							<span className="text-xs tabular-nums text-text-secondary">
								{config.baseFontSizePt}pt
							</span>
						</div>
						<Slider
							id="baseFontSize"
							min={8}
							max={12}
							step={0.5}
							value={[config.baseFontSizePt]}
							onValueChange={([v]) =>
								updateConfig("baseFontSizePt", v)
							}
							className="w-full"
						/>
					</div>

					{/* Line Height */}
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label htmlFor="lineHeight" className="text-sm">
								Line Height
							</Label>
							<span className="text-xs tabular-nums text-text-secondary">
								{config.lineHeight.toFixed(2)}
							</span>
						</div>
						<Slider
							id="lineHeight"
							min={1.0}
							max={1.5}
							step={0.05}
							value={[config.lineHeight]}
							onValueChange={([v]) =>
								updateConfig("lineHeight", v)
							}
							className="w-full"
						/>
					</div>
				</section>

				<hr className="border-border-subtle" />

				{/* Spacing */}
				<section className="space-y-3">
					<h3 className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
						Spacing
					</h3>

					{/* Section Spacing */}
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label htmlFor="sectionSpacing" className="text-sm">
								Section Spacing
							</Label>
							<span className="text-xs tabular-nums text-text-secondary">
								{config.sectionSpacingPt}pt
							</span>
						</div>
						<Slider
							id="sectionSpacing"
							min={2}
							max={16}
							step={1}
							value={[config.sectionSpacingPt]}
							onValueChange={([v]) =>
								updateConfig("sectionSpacingPt", v)
							}
							className="w-full"
						/>
					</div>
				</section>
			</div>
		</div>
	);
}
