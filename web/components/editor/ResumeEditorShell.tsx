"use client";

import { ArrowLeft, RotateCcw, Download, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EditorControls } from "./EditorControls";
import { ResumePreview } from "./ResumePreview";
import type { RenderPayload, EditorSettings } from "@/types/editor";

interface ResumeEditorShellProps {
	payload: RenderPayload;
	settings: EditorSettings;
	onSettingsChange: (settings: EditorSettings) => void;
	onReset: () => void;
	filename: string;
	onFilenameChange: (filename: string) => void;
	onDownload: () => void;
	isExporting: boolean;
	previewRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Main layout shell for the Resume Canvas Editor
 * Top bar + left controls + right preview
 */
export function ResumeEditorShell({
	payload,
	settings,
	onSettingsChange,
	onReset,
	filename,
	onFilenameChange,
	onDownload,
	isExporting,
	previewRef,
}: ResumeEditorShellProps) {
	return (
		<div className="flex h-screen flex-col bg-surface-base">
			{/* Top Bar */}
			<header className="flex h-14 shrink-0 items-center justify-between border-b border-border-subtle bg-surface-raised px-4">
				<div className="flex items-center gap-4">
					<Link href="/dashboard/generations">
						<Button variant="ghost" size="sm" className="gap-2">
							<ArrowLeft size={16} />
							<span className="hidden sm:inline">Back</span>
						</Button>
					</Link>

					<div className="h-5 w-px bg-border-subtle" />

					<div className="flex items-center gap-2">
						<label
							htmlFor="filename"
							className="text-sm text-text-secondary"
						>
							Filename:
						</label>
						<Input
							id="filename"
							type="text"
							value={filename}
							onChange={(e) => onFilenameChange(e.target.value)}
							className="h-8 w-48 text-sm"
							placeholder="resume.pdf"
						/>
					</div>
				</div>

				<div className="flex items-center gap-2">
					<Button
						variant="ghost"
						size="sm"
						onClick={onReset}
						className="gap-2"
					>
						<RotateCcw size={16} />
						<span className="hidden sm:inline">Reset</span>
					</Button>

					<Button
						size="sm"
						onClick={onDownload}
						disabled={isExporting}
						className="gap-2"
					>
						{isExporting ? (
							<Loader2 size={16} className="animate-spin" />
						) : (
							<Download size={16} />
						)}
						Download PDF
					</Button>
				</div>
			</header>

			{/* Main Content: Controls + Preview */}
			<div className="flex flex-1 overflow-hidden">
				{/* Left Panel: Controls */}
				<aside className="w-72 shrink-0 overflow-y-auto border-r border-border-subtle bg-surface-raised p-4">
					<EditorControls
						settings={settings}
						onChange={onSettingsChange}
					/>
				</aside>

				{/* Right Panel: Preview */}
				<main className="flex-1 overflow-auto bg-surface-inset p-6">
					<ResumePreview
						ref={previewRef}
						payload={payload}
						settings={settings}
					/>
				</main>
			</div>
		</div>
	);
}
