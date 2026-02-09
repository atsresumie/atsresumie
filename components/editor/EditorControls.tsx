"use client";

import type { ReactNode } from "react";
import type { EditorSettings } from "./types";
import { FONT_FAMILY_OPTIONS } from "./types";
import { Slider } from "@/components/ui/slider";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface EditorControlsProps {
	settings: EditorSettings;
	onChange: (next: EditorSettings) => void;
	className?: string;
}

function ControlSection({
	title,
	children,
}: {
	title: string;
	children: ReactNode;
}) {
	return (
		<section className="space-y-4 border-b border-border-subtle pb-5 last:border-b-0 last:pb-0">
			<h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-text-secondary">
				{title}
			</h2>
			{children}
		</section>
	);
}

function SliderControl({
	label,
	value,
	min,
	max,
	step,
	displayValue,
	onChange,
}: {
	label: string;
	value: number;
	min: number;
	max: number;
	step: number;
	displayValue: string;
	onChange: (value: number) => void;
}) {
	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between text-sm">
				<label className="text-text-primary">{label}</label>
				<span className="text-xs text-text-secondary">{displayValue}</span>
			</div>
			<Slider
				value={[value]}
				min={min}
				max={max}
				step={step}
				onValueChange={(next) => onChange(next[0] ?? value)}
			/>
		</div>
	);
}

export function EditorControls({ settings, onChange, className }: EditorControlsProps) {
	const selectedFont = FONT_FAMILY_OPTIONS.find(
		(option) => option.value === settings.fontFamily,
	);

	return (
		<div
			className={cn(
				"h-full overflow-y-auto border-r border-border-subtle bg-surface-inset/60 p-5",
				className,
			)}
		>
				<div className="mb-6 rounded-sm border border-border-visible bg-surface-raised p-4 shadow-[inset_0_1px_0_rgba(0,0,0,0.25)]">
					<p className="text-xs uppercase tracking-[0.12em] text-text-secondary">
						Resume Atelier
					</p>
				<p className="mt-2 text-sm text-text-primary">
					Formatting controls are local to this generation and saved to your browser.
				</p>
			</div>

			<div className="space-y-5">
				<ControlSection title="Typography">
					<div className="space-y-2">
						<label className="text-sm text-text-primary">Font family</label>
						<Select
							value={settings.fontFamily}
							onValueChange={(value) =>
								onChange({
									...settings,
									fontFamily: value as EditorSettings["fontFamily"],
								})
							}
						>
							<SelectTrigger>
								<SelectValue placeholder="Select a font" />
							</SelectTrigger>
							<SelectContent>
								{FONT_FAMILY_OPTIONS.map((option) => (
									<SelectItem key={option.value} value={option.value}>
										<span style={{ fontFamily: option.fontFamily }}>
											{option.label}
										</span>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						{selectedFont && (
							<p
								className="text-xs text-text-secondary"
								style={{ fontFamily: selectedFont.fontFamily }}
							>
								Aa Bb Cc 123
							</p>
						)}
					</div>

					<SliderControl
						label="Base text size"
						value={settings.baseFontSize}
						min={10}
						max={14}
						step={0.25}
						displayValue={`${settings.baseFontSize.toFixed(2)}px`}
						onChange={(value) =>
							onChange({ ...settings, baseFontSize: Number(value.toFixed(2)) })
						}
					/>

					<SliderControl
						label="Heading scale"
						value={settings.headingScale}
						min={1.05}
						max={1.8}
						step={0.05}
						displayValue={`${settings.headingScale.toFixed(2)}x`}
						onChange={(value) =>
							onChange({ ...settings, headingScale: Number(value.toFixed(2)) })
						}
					/>

					<SliderControl
						label="Line height"
						value={settings.lineHeight}
						min={1.2}
						max={1.9}
						step={0.05}
						displayValue={settings.lineHeight.toFixed(2)}
						onChange={(value) =>
							onChange({ ...settings, lineHeight: Number(value.toFixed(2)) })
						}
					/>
				</ControlSection>

				<ControlSection title="Layout">
					<div className="space-y-2">
						<label className="text-sm text-text-primary">Page size</label>
						<Select
							value={settings.pageSize}
							onValueChange={(value) =>
								onChange({
									...settings,
									pageSize: value as EditorSettings["pageSize"],
								})
							}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="letter">Letter (8.5 x 11 in)</SelectItem>
								<SelectItem value="a4">A4 (210 x 297 mm)</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<SliderControl
						label="Margins"
						value={settings.marginInches}
						min={0.4}
						max={1.2}
						step={0.05}
						displayValue={`${settings.marginInches.toFixed(2)} in`}
						onChange={(value) =>
							onChange({ ...settings, marginInches: Number(value.toFixed(2)) })
						}
					/>

					<SliderControl
						label="Section spacing"
						value={settings.sectionSpacing}
						min={8}
						max={30}
						step={1}
						displayValue={`${Math.round(settings.sectionSpacing)}px`}
						onChange={(value) =>
							onChange({ ...settings, sectionSpacing: Math.round(value) })
						}
					/>

					<div className="space-y-2">
						<label className="text-sm text-text-primary">Layout rhythm</label>
						<Select
							value={settings.layout}
							onValueChange={(value) =>
								onChange({
									...settings,
									layout: value as EditorSettings["layout"],
								})
							}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="compact">Compact</SelectItem>
								<SelectItem value="balanced">Balanced</SelectItem>
								<SelectItem value="airy">Airy</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</ControlSection>
			</div>
		</div>
	);
}
