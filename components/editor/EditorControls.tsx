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
import {
	type EditorSettings,
	type FontFamily,
	type PageSize,
	FONT_OPTIONS,
	PAGE_SIZE_OPTIONS,
} from "@/types/editor";

interface EditorControlsProps {
	settings: EditorSettings;
	onChange: (settings: EditorSettings) => void;
}

/**
 * Formatting controls panel for the editor
 */
export function EditorControls({ settings, onChange }: EditorControlsProps) {
	const updateSetting = <K extends keyof EditorSettings>(
		key: K,
		value: EditorSettings[K],
	) => {
		onChange({ ...settings, [key]: value });
	};

	return (
		<div className="space-y-6">
			<h2 className="text-sm font-semibold uppercase tracking-wide text-text-secondary">
				Formatting
			</h2>

			{/* Typography */}
			<section className="space-y-4">
				<h3 className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
					Typography
				</h3>

				{/* Font Family */}
				<div className="space-y-2">
					<Label htmlFor="fontFamily" className="text-sm">
						Font Family
					</Label>
					<Select
						value={settings.fontFamily}
						onValueChange={(v) =>
							updateSetting("fontFamily", v as FontFamily)
						}
					>
						<SelectTrigger id="fontFamily" className="w-full">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{FONT_OPTIONS.map((opt) => (
								<SelectItem key={opt.value} value={opt.value}>
									{opt.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{/* Base Font Size */}
				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<Label htmlFor="baseFontSize" className="text-sm">
							Font Size
						</Label>
						<span className="text-xs text-text-secondary">
							{settings.baseFontSize}pt
						</span>
					</div>
					<Slider
						id="baseFontSize"
						min={9}
						max={14}
						step={0.5}
						value={[settings.baseFontSize]}
						onValueChange={([v]) =>
							updateSetting("baseFontSize", v)
						}
						className="w-full"
					/>
				</div>

				{/* Heading Scale */}
				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<Label htmlFor="headingScale" className="text-sm">
							Heading Scale
						</Label>
						<span className="text-xs text-text-secondary">
							{settings.headingScale.toFixed(2)}×
						</span>
					</div>
					<Slider
						id="headingScale"
						min={1.1}
						max={2}
						step={0.05}
						value={[settings.headingScale]}
						onValueChange={([v]) =>
							updateSetting("headingScale", v)
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
						<span className="text-xs text-text-secondary">
							{settings.lineHeight.toFixed(2)}
						</span>
					</div>
					<Slider
						id="lineHeight"
						min={1.1}
						max={2}
						step={0.05}
						value={[settings.lineHeight]}
						onValueChange={([v]) => updateSetting("lineHeight", v)}
						className="w-full"
					/>
				</div>
			</section>

			<hr className="border-border-subtle" />

			{/* Layout */}
			<section className="space-y-4">
				<h3 className="text-xs font-medium uppercase tracking-wider text-text-tertiary">
					Layout
				</h3>

				{/* Page Size */}
				<div className="space-y-2">
					<Label htmlFor="pageSize" className="text-sm">
						Page Size
					</Label>
					<Select
						value={settings.pageSize}
						onValueChange={(v) =>
							updateSetting("pageSize", v as PageSize)
						}
					>
						<SelectTrigger id="pageSize" className="w-full">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{PAGE_SIZE_OPTIONS.map((opt) => (
								<SelectItem key={opt.value} value={opt.value}>
									{opt.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{/* Margins */}
				<div className="space-y-3">
					<Label className="text-sm">Margins (mm)</Label>
					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-1">
							<div className="flex items-center justify-between">
								<span className="text-xs text-text-tertiary">
									Top
								</span>
								<span className="text-xs text-text-secondary">
									{Math.round(settings.marginTop)}
								</span>
							</div>
							<Slider
								min={10}
								max={40}
								step={1}
								value={[settings.marginTop]}
								onValueChange={([v]) =>
									updateSetting("marginTop", v)
								}
							/>
						</div>
						<div className="space-y-1">
							<div className="flex items-center justify-between">
								<span className="text-xs text-text-tertiary">
									Bottom
								</span>
								<span className="text-xs text-text-secondary">
									{Math.round(settings.marginBottom)}
								</span>
							</div>
							<Slider
								min={10}
								max={40}
								step={1}
								value={[settings.marginBottom]}
								onValueChange={([v]) =>
									updateSetting("marginBottom", v)
								}
							/>
						</div>
						<div className="space-y-1">
							<div className="flex items-center justify-between">
								<span className="text-xs text-text-tertiary">
									Left
								</span>
								<span className="text-xs text-text-secondary">
									{Math.round(settings.marginLeft)}
								</span>
							</div>
							<Slider
								min={10}
								max={40}
								step={1}
								value={[settings.marginLeft]}
								onValueChange={([v]) =>
									updateSetting("marginLeft", v)
								}
							/>
						</div>
						<div className="space-y-1">
							<div className="flex items-center justify-between">
								<span className="text-xs text-text-tertiary">
									Right
								</span>
								<span className="text-xs text-text-secondary">
									{Math.round(settings.marginRight)}
								</span>
							</div>
							<Slider
								min={10}
								max={40}
								step={1}
								value={[settings.marginRight]}
								onValueChange={([v]) =>
									updateSetting("marginRight", v)
								}
							/>
						</div>
					</div>
				</div>

				{/* Section Spacing */}
				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<Label htmlFor="sectionSpacing" className="text-sm">
							Section Spacing
						</Label>
						<span className="text-xs text-text-secondary">
							{settings.sectionSpacing}px
						</span>
					</div>
					<Slider
						id="sectionSpacing"
						min={8}
						max={32}
						step={2}
						value={[settings.sectionSpacing]}
						onValueChange={([v]) =>
							updateSetting("sectionSpacing", v)
						}
						className="w-full"
					/>
				</div>
			</section>
		</div>
	);
}
