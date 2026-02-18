"use client";

import { FileText, FileType, Loader2, FileCheck } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ExportFormat } from "@/hooks/useExportModal";

// ---------------------------------------------------------------------------
// Format option configuration
// ---------------------------------------------------------------------------

interface FormatOption {
	value: ExportFormat;
	label: string;
	sublabel: string;
	icon: React.ReactNode;
	badge?: string;
	disabled?: boolean;
}

const FORMAT_OPTIONS: FormatOption[] = [
	{
		value: "pdf",
		label: "PDF",
		sublabel: "Recommended · ATS-ready formatting",
		icon: <FileCheck size={20} />,
		badge: "Recommended",
	},
	{
		value: "txt",
		label: "Plain Text",
		sublabel: "Lightweight · Universal compatibility",
		icon: <FileText size={20} />,
	},
	{
		value: "docx",
		label: "DOCX",
		sublabel: "Coming soon",
		icon: <FileType size={20} />,
		disabled: true,
	},
];

// ---------------------------------------------------------------------------
// ExportModal
// ---------------------------------------------------------------------------

interface ExportModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	selectedFormat: ExportFormat;
	onFormatChange: (format: ExportFormat) => void;
	onDownload: () => void;
	isExporting: boolean;
}

export function ExportModal({
	open,
	onOpenChange,
	selectedFormat,
	onFormatChange,
	onDownload,
	isExporting,
}: ExportModalProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Download Resume</DialogTitle>
					<DialogDescription>
						Choose an export format for your tailored resume.
					</DialogDescription>
				</DialogHeader>

				{/* Format selector */}
				<div
					className="grid gap-2 py-2"
					role="radiogroup"
					aria-label="Export format"
				>
					{FORMAT_OPTIONS.map((opt) => {
						const isSelected = selectedFormat === opt.value;
						const isDisabled = opt.disabled || isExporting;

						return (
							<button
								key={opt.value}
								type="button"
								role="radio"
								aria-checked={isSelected}
								aria-disabled={isDisabled}
								tabIndex={isDisabled ? -1 : 0}
								disabled={isDisabled}
								onClick={() => {
									if (!isDisabled) onFormatChange(opt.value);
								}}
								className={cn(
									"flex items-center gap-3 rounded-lg border p-3 text-left transition-colors",
									"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-raised",
									isDisabled
										? "cursor-not-allowed border-border-subtle/40 bg-surface-inset/30 opacity-50"
										: isSelected
											? "border-accent/50 bg-accent/5"
											: "border-border-subtle hover:border-border-visible hover:bg-surface-inset/50",
								)}
							>
								{/* Icon */}
								<div
									className={cn(
										"flex h-9 w-9 shrink-0 items-center justify-center rounded-md",
										isDisabled
											? "bg-surface-inset/50 text-text-tertiary"
											: isSelected
												? "bg-accent/10 text-accent"
												: "bg-surface-inset text-text-secondary",
									)}
								>
									{opt.icon}
								</div>

								{/* Text */}
								<div className="min-w-0 flex-1">
									<div className="flex items-center gap-2">
										<span
											className={cn(
												"text-sm font-medium",
												isDisabled
													? "text-text-tertiary"
													: "text-text-primary",
											)}
										>
											{opt.label}
										</span>
										{opt.badge && !opt.disabled && (
											<span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-accent">
												{opt.badge}
											</span>
										)}
										{opt.disabled && (
											<span className="rounded-full bg-surface-inset px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-text-tertiary">
												Coming soon
											</span>
										)}
									</div>
									<p
										className={cn(
											"mt-0.5 text-xs",
											isDisabled
												? "text-text-tertiary"
												: "text-text-secondary",
										)}
									>
										{opt.sublabel}
									</p>
								</div>

								{/* Radio dot */}
								{!isDisabled && (
									<div
										className={cn(
											"flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
											isSelected
												? "border-accent"
												: "border-border-visible",
										)}
									>
										{isSelected && (
											<div className="h-2 w-2 rounded-full bg-accent" />
										)}
									</div>
								)}
							</button>
						);
					})}
				</div>

				{/* Footer */}
				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isExporting}
					>
						Cancel
					</Button>
					<Button onClick={onDownload} disabled={isExporting}>
						{isExporting ? (
							<>
								<Loader2
									size={16}
									className="mr-2 animate-spin"
								/>
								Preparing your file…
							</>
						) : (
							"Download"
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
