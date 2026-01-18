"use client";

import { File, X } from "lucide-react";

interface FilePreviewProps {
	file: File;
	onRemove: () => void;
}

function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FilePreview({ file, onRemove }: FilePreviewProps) {
	return (
		<div className="flex h-20 w-full items-center justify-between rounded-xl border border-[rgba(233,221,199,0.15)] bg-[rgba(233,221,199,0.05)] px-4">
			<div className="flex items-center gap-3">
				<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[rgba(233,221,199,0.1)]">
					<File className="h-5 w-5 text-[rgba(233,221,199,0.7)]" />
				</div>
				<div>
					<p className="text-sm font-medium text-[#E9DDC7] truncate max-w-[200px]">
						{file.name}
					</p>
					<p className="text-xs text-[rgba(233,221,199,0.5)]">
						{formatFileSize(file.size)}
					</p>
				</div>
			</div>
			<button
				onClick={onRemove}
				className="flex h-8 w-8 items-center justify-center rounded-lg text-[rgba(233,221,199,0.5)] transition-colors hover:bg-[rgba(233,221,199,0.1)] hover:text-[#E9DDC7]"
				type="button"
			>
				<X className="h-4 w-4" />
			</button>
		</div>
	);
}
