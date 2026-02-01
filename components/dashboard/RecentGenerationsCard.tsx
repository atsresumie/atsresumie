"use client";

import { useState } from "react";
import Link from "next/link";
import {
	Eye,
	Download,
	RefreshCw,
	Sparkles,
	Loader2,
	AlertCircle,
} from "lucide-react";
import {
	useRecentGenerations,
	deriveJobLabel,
	type GenerationJob,
	type GenerationJobStatus,
} from "@/hooks/useRecentGenerations";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Returns relative time string (e.g., "2 hours ago")
 */
function getRelativeTime(dateString: string): string {
	const date = new Date(dateString);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffMins = Math.floor(diffMs / 60000);
	const diffHours = Math.floor(diffMins / 60);
	const diffDays = Math.floor(diffHours / 24);

	if (diffMins < 1) return "Just now";
	if (diffMins < 60) return `${diffMins}m ago`;
	if (diffHours < 24) return `${diffHours}h ago`;
	if (diffDays < 7) return `${diffDays}d ago`;

	return date.toLocaleDateString();
}

/**
 * Status badge component with theme-consistent colors
 */
function StatusBadge({ status }: { status: GenerationJobStatus }) {
	const config: Record<
		GenerationJobStatus,
		{ label: string; className: string }
	> = {
		queued: {
			label: "Pending",
			className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
		},
		processing: {
			label: "Running",
			className: "bg-blue-500/10 text-blue-400 border-blue-500/20",
		},
		succeeded: {
			label: "Succeeded",
			className:
				"bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
		},
		failed: {
			label: "Failed",
			className: "bg-red-500/10 text-red-400 border-red-500/20",
		},
	};

	const { label, className } = config[status] || config.queued;

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

/**
 * Single job row component
 */
function JobRow({ job }: { job: GenerationJob }) {
	const [isDownloading, setIsDownloading] = useState(false);
	const [downloadError, setDownloadError] = useState<string | null>(null);

	const label = deriveJobLabel(job.jd_text);
	const relativeTime = getRelativeTime(job.created_at);
	const canDownload = job.status === "succeeded" && job.pdf_object_path;

	const handleDownload = async () => {
		if (!canDownload) return;

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
		<div className="flex items-center justify-between gap-4 rounded-lg border border-border/30 bg-muted/20 px-4 py-3">
			{/* Left: Info */}
			<div className="min-w-0 flex-1">
				<p className="truncate font-medium text-foreground">{label}</p>
				<div className="mt-1 flex items-center gap-2">
					<StatusBadge status={job.status} />
					<span className="text-xs text-muted-foreground">
						{relativeTime}
					</span>
				</div>
				{downloadError && (
					<p className="mt-1 text-xs text-red-400">{downloadError}</p>
				)}
			</div>

			{/* Right: Actions */}
			<div className="flex items-center gap-2">
				<Link href="/dashboard/generations">
					<Button variant="ghost" size="sm" className="h-8 px-2">
						<Eye size={16} />
						<span className="ml-1 hidden sm:inline">View</span>
					</Button>
				</Link>
				<Button
					variant="ghost"
					size="sm"
					className="h-8 px-2"
					disabled={!canDownload || isDownloading}
					onClick={handleDownload}
				>
					{isDownloading ? (
						<Loader2 size={16} className="animate-spin" />
					) : (
						<Download size={16} />
					)}
					<span className="ml-1 hidden sm:inline">Download</span>
				</Button>
			</div>
		</div>
	);
}

/**
 * Loading skeleton for job rows
 */
function JobRowSkeleton() {
	return (
		<div className="flex items-center justify-between gap-4 rounded-lg border border-border/30 bg-muted/20 px-4 py-3">
			<div className="min-w-0 flex-1 space-y-2">
				<Skeleton className="h-4 w-48" />
				<div className="flex items-center gap-2">
					<Skeleton className="h-5 w-16 rounded-full" />
					<Skeleton className="h-3 w-12" />
				</div>
			</div>
			<div className="flex items-center gap-2">
				<Skeleton className="h-8 w-16" />
				<Skeleton className="h-8 w-20" />
			</div>
		</div>
	);
}

/**
 * Empty state when no generations exist
 */
function EmptyState() {
	return (
		<div className="flex flex-col items-center justify-center py-8 text-center">
			<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted/50">
				<Sparkles size={24} className="text-muted-foreground" />
			</div>
			<h3 className="mb-1 font-medium text-foreground">
				No generations yet
			</h3>
			<p className="mb-4 text-sm text-muted-foreground">
				Create your first ATS-optimized resume
			</p>
			<Link href="/dashboard/generate">
				<Button size="sm">
					<Sparkles size={16} className="mr-2" />
					Generate your first resume
				</Button>
			</Link>
		</div>
	);
}

/**
 * Error state with retry
 */
function ErrorState({
	error,
	onRetry,
}: {
	error: string;
	onRetry: () => void;
}) {
	return (
		<div className="flex flex-col items-center justify-center py-8 text-center">
			<div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
				<AlertCircle size={24} className="text-red-400" />
			</div>
			<h3 className="mb-1 font-medium text-foreground">
				Failed to load generations
			</h3>
			<p className="mb-4 text-sm text-muted-foreground">{error}</p>
			<Button size="sm" variant="outline" onClick={onRetry}>
				<RefreshCw size={16} className="mr-2" />
				Retry
			</Button>
		</div>
	);
}

/**
 * Main Recent Generations Card component
 */
export function RecentGenerationsCard() {
	const { jobs, isLoading, error, refetch } = useRecentGenerations();

	return (
		<div className="rounded-xl border border-border/50 bg-card/50 p-6">
			{/* Header */}
			<div className="mb-4 flex items-center justify-between">
				<h2 className="text-lg font-semibold text-foreground">
					Recent Generations
				</h2>
				<Link
					href="/dashboard/generations"
					className="text-sm text-muted-foreground hover:text-foreground transition-colors"
				>
					View all →
				</Link>
			</div>

			{/* Content */}
			<div className="space-y-3">
				{isLoading ? (
					<>
						<JobRowSkeleton />
						<JobRowSkeleton />
						<JobRowSkeleton />
					</>
				) : error ? (
					<ErrorState error={error} onRetry={refetch} />
				) : jobs.length === 0 ? (
					<EmptyState />
				) : (
					jobs.map((job) => <JobRow key={job.id} job={job} />)
				)}
			</div>
		</div>
	);
}
