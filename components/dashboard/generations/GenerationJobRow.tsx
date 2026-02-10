"use client";

import { useState } from "react";
import Link from "next/link";
import {
	Eye,
	Download,
	Copy,
	Trash2,
	Loader2,
	FileCheck,
	Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	type GenerationJobFull,
	type GenerationJobStatus,
	STATUS_LABELS,
	deriveJobLabel,
	getRelativeTime,
} from "@/hooks/useGenerations";
import { cn } from "@/lib/utils";

interface GenerationJobRowProps {
	job: GenerationJobFull;
	onView: (job: GenerationJobFull) => void;
	onDuplicate: (job: GenerationJobFull) => void;
	onDelete: (job: GenerationJobFull) => void;
}

/**
 * Status badge component with theme-consistent colors
 */
function StatusBadge({ status }: { status: GenerationJobStatus }) {
	const config: Record<GenerationJobStatus, { className: string }> = {
		queued: {
			className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
		},
		processing: {
			className: "bg-blue-500/10 text-blue-400 border-blue-500/20",
		},
		succeeded: {
			className:
				"bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
		},
		failed: {
			className: "bg-red-500/10 text-red-400 border-red-500/20",
		},
	};

	const { className } = config[status] || config.queued;
	const label = STATUS_LABELS[status] || status;

	return (
		<span
			className={cn(
				"inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
				className,
			)}
		>
			{label}
		</span>
	);
}

export function GenerationJobRow({
	job,
	onView,
	onDuplicate,
	onDelete,
}: GenerationJobRowProps) {
	const [isDownloading, setIsDownloading] = useState(false);
	const [downloadError, setDownloadError] = useState<string | null>(null);

	const label = deriveJobLabel(job.jd_text);
	const relativeTime = getRelativeTime(job.created_at);
	const hasPdf = job.status === "succeeded" && !!job.pdf_object_path;

	const handleDownload = async () => {
		if (!hasPdf) return;

		setIsDownloading(true);
		setDownloadError(null);

		try {
			const res = await fetch("/api/export-pdf", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ jobId: job.id }),
			});

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || "Failed to download PDF");
			}

			const { pdfUrl } = await res.json();
			window.open(pdfUrl, "_blank");
		} catch (err) {
			console.error("Download error:", err);
			setDownloadError(
				err instanceof Error ? err.message : "Download failed",
			);
		} finally {
			setIsDownloading(false);
		}
	};

	return (
		<div className="group flex flex-col gap-3 rounded-xl border border-border/50 bg-card/50 p-4 transition-colors hover:bg-card/80 sm:flex-row sm:items-center sm:justify-between">
			{/* Left: Info */}
			<div className="min-w-0 flex-1 space-y-1">
				<div className="flex items-center gap-2">
					<p className="truncate font-medium text-foreground">
						{label}
					</p>
					{hasPdf && (
						<FileCheck
							size={14}
							className="flex-shrink-0 text-emerald-400"
						/>
					)}
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<StatusBadge status={job.status} />
					<span className="text-xs text-muted-foreground">
						{relativeTime}
					</span>
				</div>
				{downloadError && (
					<p className="text-xs text-red-400">{downloadError}</p>
				)}
			</div>

			{/* Right: Actions */}
			<div className="flex flex-wrap items-center gap-2">
				<Button
					variant="ghost"
					size="sm"
					className="h-8 px-2"
					onClick={() => onView(job)}
				>
					<Eye size={16} />
					<span className="ml-1 hidden sm:inline">View</span>
				</Button>

				{job.status === "succeeded" && (
					<Link href={`/dashboard/editor/${job.id}`}>
						<Button variant="ghost" size="sm" className="h-8 px-2">
							<Pencil size={16} />
							<span className="ml-1 hidden sm:inline">Edit</span>
						</Button>
					</Link>
				)}

				<Button
					variant="ghost"
					size="sm"
					className="h-8 px-2"
					disabled={!hasPdf || isDownloading}
					onClick={handleDownload}
				>
					{isDownloading ? (
						<Loader2 size={16} className="animate-spin" />
					) : (
						<Download size={16} />
					)}
					<span className="ml-1 hidden sm:inline">Download</span>
				</Button>

				<Button
					variant="ghost"
					size="sm"
					className="h-8 px-2"
					onClick={() => onDuplicate(job)}
				>
					<Copy size={16} />
					<span className="ml-1 hidden sm:inline">Duplicate</span>
				</Button>

				<Button
					variant="ghost"
					size="sm"
					className="h-8 px-2 text-muted-foreground hover:text-red-400"
					onClick={() => onDelete(job)}
				>
					<Trash2 size={16} />
					<span className="ml-1 hidden sm:inline">Delete</span>
				</Button>
			</div>
		</div>
	);
}
