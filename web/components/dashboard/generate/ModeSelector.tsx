"use client";

import { cn } from "@/lib/utils";
import { Zap, Target, FilePlus } from "lucide-react";

export type GenerationMode = "quick" | "deep" | "scratch";

interface ModeOption {
	key: GenerationMode;
	title: string;
	desc: string;
	badge: string;
	icon: React.ElementType;
}

const modes: ModeOption[] = [
	{
		key: "quick",
		title: "Quick Optimize",
		desc: "Minimal inputs, strong results",
		badge: "Best for speed",
		icon: Zap,
	},
	{
		key: "deep",
		title: "Deep Tailor",
		desc: "Extra questions for best match",
		badge: "Best results",
		icon: Target,
	},
	{
		key: "scratch",
		title: "From Scratch",
		desc: "Build from profile details",
		badge: "New resume",
		icon: FilePlus,
	},
];

interface ModeSelectorProps {
	value: GenerationMode;
	onChange: (mode: GenerationMode) => void;
	disabled?: boolean;
}

/**
 * Mode selector for generation page.
 * All modes are supported by the backend edge function.
 */
export function ModeSelector({ value, onChange, disabled }: ModeSelectorProps) {
	return (
		<div className="grid gap-3 sm:grid-cols-3">
			{modes.map((mode) => {
				const selected = value === mode.key;
				const Icon = mode.icon;

				return (
					<button
						key={mode.key}
						type="button"
						onClick={() => !disabled && onChange(mode.key)}
						disabled={disabled}
						className={cn(
							"relative rounded-xl border p-4 text-left transition-all",
							"focus:outline-none focus:ring-2 focus:ring-primary/50",
							selected
								? "border-emerald-500 bg-emerald-500/20 shadow-lg shadow-emerald-500/20"
								: "border-border/50 bg-card/50 hover:border-border",
							disabled && "opacity-50 cursor-not-allowed",
						)}
					>
						{/* Badge */}
						<div className="mb-2">
							<span
								className={cn(
									"text-xs",
									selected
										? "text-emerald-400"
										: "text-muted-foreground",
								)}
							>
								{mode.badge}
							</span>
						</div>

						{/* Title with Icon */}
						<div className="flex items-center gap-2 mb-1">
							<Icon
								size={16}
								className={cn(
									selected
										? "text-emerald-400"
										: "text-muted-foreground",
								)}
							/>
							<span
								className={cn(
									"font-medium text-sm",
									selected && "text-foreground",
								)}
							>
								{mode.title}
							</span>
						</div>

						{/* Description */}
						<p className="text-xs text-muted-foreground">
							{mode.desc}
						</p>

						{/* Selected indicator */}
						{selected && (
							<div className="absolute -top-px -left-px -right-px h-1 rounded-t-xl bg-emerald-500" />
						)}
					</button>
				);
			})}
		</div>
	);
}
