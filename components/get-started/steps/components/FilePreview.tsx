"use client";

import { File as FileIcon, X, CheckCircle, Loader2 } from "lucide-react";

interface FilePreviewProps {
	file?: File;
	filename?: string; // For restored sessions where we only have the filename
	onRemove: () => void;
	isRestored?: boolean; // Indicates this is a restored file from previous session
	isDeleting?: boolean; // Indicates deletion is in progress
}

function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FilePreview({ file, filename, onRemove, isRestored, isDeleting }: FilePreviewProps) {
	const displayName = file?.name ?? filename ?? "Unknown file";
	const displaySize = file ? formatFileSize(file.size) : null;

	return (
		<div className="flex h-20 w-full items-center justify-between rounded-xl border border-[rgba(233,221,199,0.15)] bg-[rgba(233,221,199,0.05)] px-4">
			<div className="flex items-center gap-3">
				<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[rgba(233,221,199,0.1)]">
					{isDeleting ? (
						<Loader2 className="h-5 w-5 text-[rgba(233,221,199,0.7)] animate-spin" />
					) : isRestored ? (
						<CheckCircle className="h-5 w-5 text-green-400" />
					) : (
						<FileIcon className="h-5 w-5 text-[rgba(233,221,199,0.7)]" />
					)}
				</div>
				<div>
					<p className="text-sm font-medium text-[#E9DDC7] truncate max-w-[200px]">
						{displayName}
					</p>
					<p className="text-xs text-[rgba(233,221,199,0.5)]">
						{isDeleting ? "Removing..." : (displaySize ?? (isRestored ? "Previously uploaded" : "Unknown size"))}
					</p>
				</div>
			</div>
			<button
				onClick={onRemove}
				disabled={isDeleting}
				className="flex h-8 w-8 items-center justify-center rounded-lg text-[rgba(233,221,199,0.5)] transition-colors hover:bg-[rgba(233,221,199,0.1)] hover:text-[#E9DDC7] disabled:opacity-50 disabled:cursor-not-allowed"
				type="button"
				title={isDeleting ? "Removing..." : (isRestored ? "Remove and upload a different file" : "Remove file")}
			>
				<X className="h-4 w-4" />
			</button>
		</div>
	);
}

