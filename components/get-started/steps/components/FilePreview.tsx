"use client";

import {
	File as FileIcon,
	X,
	CheckCircle,
	Loader2,
	AlertCircle,
	RefreshCw,
} from "lucide-react";

type UploadState =
	| "idle"
	| "preparing"
	| "uploading"
	| "uploaded_temp"
	| "uploaded_final"
	| "error";

interface FilePreviewProps {
	file?: File;
	filename?: string; // For restored sessions where we only have the filename
	onRemove: () => void;
	onCancel?: () => void; // Cancel upload
	onRetry?: () => void; // Retry failed upload

	// Upload state
	uploadState?: UploadState;
	uploadProgress?: number; // 0-100
	uploadedBytes?: number;
	totalBytes?: number;
	estimatedSecondsRemaining?: number;
	errorMessage?: string;

	// Legacy props for backwards compatibility
	isRestored?: boolean; // Indicates this is a restored file from previous session
	isDeleting?: boolean; // Indicates deletion is in progress
}

function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatTime(seconds: number): string {
	if (seconds < 60) return `~${seconds}s remaining`;
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = seconds % 60;
	return `~${minutes}m ${remainingSeconds}s remaining`;
}

export default function FilePreview({
	file,
	filename,
	onRemove,
	onCancel,
	onRetry,
	uploadState = "idle",
	uploadProgress = 0,
	uploadedBytes = 0,
	totalBytes = 0,
	estimatedSecondsRemaining,
	errorMessage,
	isRestored,
	isDeleting,
}: FilePreviewProps) {
	const displayName = file?.name ?? filename ?? "Unknown file";
	const displaySize = file ? formatFileSize(file.size) : null;

	// Determine the icon and status based on upload state
	const renderIcon = () => {
		if (isDeleting) {
			return (
				<Loader2 className="h-5 w-5 text-[rgba(233,221,199,0.7)] animate-spin" />
			);
		}

		switch (uploadState) {
			case "preparing":
				return (
					<Loader2 className="h-5 w-5 text-[rgba(233,221,199,0.7)] animate-spin" />
				);
			case "uploading":
				return (
					<Loader2 className="h-5 w-5 text-blue-400 animate-spin" />
				);
			case "uploaded_temp":
				return <CheckCircle className="h-5 w-5 text-yellow-400" />;
			case "uploaded_final":
				return <CheckCircle className="h-5 w-5 text-green-400" />;
			case "error":
				return <AlertCircle className="h-5 w-5 text-red-400" />;
			default:
				if (isRestored) {
					return <CheckCircle className="h-5 w-5 text-green-400" />;
				}
				return (
					<FileIcon className="h-5 w-5 text-[rgba(233,221,199,0.7)]" />
				);
		}
	};

	// Determine status text
	const renderStatus = () => {
		if (isDeleting) {
			return "Removing...";
		}

		switch (uploadState) {
			case "preparing":
				return "Preparing upload…";
			case "uploading":
				const progressText = `${uploadProgress}%`;
				const bytesText =
					totalBytes > 0
						? ` • ${formatFileSize(uploadedBytes)} / ${formatFileSize(totalBytes)}`
						: "";
				const etaText =
					estimatedSecondsRemaining !== undefined &&
					estimatedSecondsRemaining > 0
						? ` • ${formatTime(estimatedSecondsRemaining)}`
						: "";
				return (
					<span className="flex items-center gap-1">
						<span className="text-blue-400 font-medium">
							{progressText}
						</span>
						<span>{bytesText}</span>
						<span className="text-[rgba(233,221,199,0.4)]">
							{etaText}
						</span>
					</span>
				);
			case "uploaded_temp":
				return (
					<span className="flex items-center gap-1.5">
						{displaySize}
						<span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
							Not confirmed
						</span>
					</span>
				);
			case "uploaded_final":
				return (
					<span className="flex items-center gap-1.5">
						{displaySize}
						<span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-500/20 text-green-400 border border-green-500/30">
							Uploaded
						</span>
					</span>
				);
			case "error":
				return (
					<span className="text-red-400 text-xs">
						{errorMessage || "Upload failed"}
					</span>
				);
			default:
				return (
					displaySize ??
					(isRestored ? "Previously uploaded" : "Unknown size")
				);
		}
	};

	// Render action button (Remove/Cancel/Retry)
	const renderActionButton = () => {
		if (uploadState === "uploading" && onCancel) {
			return (
				<button
					onClick={onCancel}
					className="flex h-8 items-center justify-center gap-1 rounded-lg px-2 text-xs text-[rgba(233,221,199,0.7)] transition-colors hover:bg-[rgba(233,221,199,0.1)] hover:text-[#E9DDC7]"
					type="button"
					title="Cancel upload"
				>
					<X className="h-4 w-4" />
					Cancel
				</button>
			);
		}

		if (uploadState === "error" && onRetry) {
			return (
				<div className="flex items-center gap-1">
					<button
						onClick={onRetry}
						className="flex h-8 items-center justify-center gap-1 rounded-lg px-2 text-xs text-blue-400 transition-colors hover:bg-blue-500/10"
						type="button"
						title="Retry upload"
					>
						<RefreshCw className="h-3.5 w-3.5" />
						Retry
					</button>
					<button
						onClick={onRemove}
						className="flex h-8 w-8 items-center justify-center rounded-lg text-[rgba(233,221,199,0.5)] transition-colors hover:bg-[rgba(233,221,199,0.1)] hover:text-[#E9DDC7]"
						type="button"
						title="Remove file"
					>
						<X className="h-4 w-4" />
					</button>
				</div>
			);
		}

		return (
			<button
				onClick={onRemove}
				disabled={isDeleting || uploadState === "preparing"}
				className="flex h-8 w-8 items-center justify-center rounded-lg text-[rgba(233,221,199,0.5)] transition-colors hover:bg-[rgba(233,221,199,0.1)] hover:text-[#E9DDC7] disabled:opacity-50 disabled:cursor-not-allowed"
				type="button"
				title={
					isDeleting
						? "Removing..."
						: isRestored
							? "Remove and upload a different file"
							: "Remove file"
				}
			>
				<X className="h-4 w-4" />
			</button>
		);
	};

	return (
		<div className="flex min-h-[80px] w-full flex-col rounded-xl border border-[rgba(233,221,199,0.15)] bg-[rgba(233,221,199,0.05)]">
			{/* Main content row */}
			<div className="flex flex-1 items-center justify-between px-4 py-3">
				<div className="flex items-center gap-3 min-w-0">
					<div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[rgba(233,221,199,0.1)]">
						{renderIcon()}
					</div>
					<div className="min-w-0">
						<p className="text-sm font-medium text-[#E9DDC7] truncate max-w-[200px]">
							{displayName}
						</p>
						<p className="text-xs text-[rgba(233,221,199,0.5)]">
							{renderStatus()}
						</p>
					</div>
				</div>
				{renderActionButton()}
			</div>

			{/* Progress bar */}
			{uploadState === "uploading" && (
				<div className="px-4 pb-3">
					<div className="h-1.5 w-full rounded-full bg-[rgba(233,221,199,0.1)] overflow-hidden">
						<div
							className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-300 ease-out"
							style={{ width: `${uploadProgress}%` }}
						/>
					</div>
				</div>
			)}
		</div>
	);
}
