"use client";

import { Suspense, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
	Download,
	RefreshCw,
	AlertCircle,
	FileText,
	ExternalLink,
	Loader2,
	Search,
	ArrowUpDown,
	Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useDownloads, type DownloadItem } from "@/hooks/useDownloads";
import { getRelativeTime } from "@/hooks/useGenerations";
import { toast } from "sonner";

type SortOrder = "newest" | "oldest";

/**
 * Loading skeleton for download rows
 */
function DownloadRowSkeleton() {
	return (
		<div className="flex items-center justify-between gap-4 rounded-xl border border-border/50 bg-card/50 p-4">
			<div className="min-w-0 flex-1 space-y-2">
				<Skeleton className="h-5 w-56" />
				<div className="flex items-center gap-2">
					<Skeleton className="h-5 w-20 rounded-full" />
					<Skeleton className="h-3 w-16" />
				</div>
			</div>
			<div className="flex items-center gap-2">
				<Skeleton className="h-8 w-24" />
				<Skeleton className="h-8 w-24" />
			</div>
		</div>
	);
}

/**
 * Empty state when no PDFs exist
 */
function EmptyState() {
	return (
		<div className="flex flex-col items-center justify-center py-16 text-center">
			<div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
				<FileText size={32} className="text-muted-foreground" />
			</div>
			<h3 className="mb-2 text-lg font-semibold text-foreground">
				No PDFs yet
			</h3>
			<p className="mb-6 max-w-sm text-muted-foreground">
				Generate your first ATS-optimized resume to see it here.
			</p>
			<Link href="/dashboard/generate">
				<Button>
					<Sparkles size={16} className="mr-2" />
					Generate a resume
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
		<div className="flex flex-col items-center justify-center py-16 text-center">
			<div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
				<AlertCircle size={32} className="text-red-400" />
			</div>
			<h3 className="mb-2 text-lg font-semibold text-foreground">
				Failed to load downloads
			</h3>
			<p className="mb-6 max-w-sm text-muted-foreground">{error}</p>
			<Button variant="outline" onClick={onRetry}>
				<RefreshCw size={16} className="mr-2" />
				Retry
			</Button>
		</div>
	);
}

/**
 * No results after filtering
 */
function NoResultsState() {
	return (
		<div className="flex flex-col items-center justify-center py-16 text-center">
			<p className="text-muted-foreground">
				No downloads match your search.
			</p>
		</div>
	);
}

/**
 * Status badge for available PDFs
 */
function AvailableBadge() {
	return (
		<span className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
			Available
		</span>
	);
}

/**
 * Individual download row
 */
function DownloadRow({
	item,
	onViewSource,
}: {
	item: DownloadItem;
	onViewSource: (jobId: string) => void;
}) {
	const [isDownloading, setIsDownloading] = useState(false);
	const [downloadError, setDownloadError] = useState<string | null>(null);

	const relativeTime = getRelativeTime(item.createdAt);

	const handleDownload = async () => {
		setIsDownloading(true);
		setDownloadError(null);

		// Open window synchronously to avoid popup blocker
		const newWindow = window.open("", "_blank");

		try {
			const res = await fetch("/api/export-pdf", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ jobId: item.id }),
			});

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || "Failed to get download URL");
			}

			const { pdfUrl } = await res.json();

			if (newWindow) {
				newWindow.location.href = pdfUrl;
			} else {
				// Fallback if popup was blocked
				toast.info("Download ready", {
					description: "Click here to download your PDF",
					action: {
						label: "Download",
						onClick: () => window.open(pdfUrl, "_blank"),
					},
					duration: 10000,
				});
			}
		} catch (err) {
			console.error("Download error:", err);
			const errorMsg =
				err instanceof Error ? err.message : "Download failed";
			setDownloadError(errorMsg);
			toast.error("Download failed", { description: errorMsg });

			// Close the empty window if we opened one
			if (newWindow) {
				newWindow.close();
			}
		} finally {
			setIsDownloading(false);
		}
	};

	return (
		<div className="group flex flex-col gap-3 rounded-xl border border-border/50 bg-card/50 p-4 transition-colors hover:bg-card/80 sm:flex-row sm:items-center sm:justify-between">
			{/* Left: Info */}
			<div className="min-w-0 flex-1 space-y-1">
				<div className="flex items-center gap-2">
					<FileText
						size={16}
						className="flex-shrink-0 text-muted-foreground"
					/>
					<p className="truncate font-medium text-foreground">
						{item.fileName}
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<AvailableBadge />
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
					variant="default"
					size="sm"
					className="h-8"
					disabled={isDownloading}
					onClick={handleDownload}
				>
					{isDownloading ? (
						<Loader2 size={16} className="mr-1 animate-spin" />
					) : (
						<Download size={16} className="mr-1" />
					)}
					Download
				</Button>

				<Button
					variant="ghost"
					size="sm"
					className="h-8"
					onClick={() => onViewSource(item.id)}
				>
					<ExternalLink size={16} className="mr-1" />
					<span className="hidden sm:inline">View source</span>
				</Button>
			</div>
		</div>
	);
}

/**
 * Filters component: search + sort
 */
function DownloadFilters({
	searchQuery,
	onSearchChange,
	sortOrder,
	onSortChange,
}: {
	searchQuery: string;
	onSearchChange: (value: string) => void;
	sortOrder: SortOrder;
	onSortChange: (value: SortOrder) => void;
}) {
	return (
		<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
			{/* Search */}
			<div className="relative flex-1">
				<Search
					size={16}
					className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
				/>
				<Input
					placeholder="Search by file name..."
					value={searchQuery}
					onChange={(e) => onSearchChange(e.target.value)}
					className="pl-9"
				/>
			</div>

			{/* Sort */}
			<Select value={sortOrder} onValueChange={onSortChange}>
				<SelectTrigger className="w-full sm:w-44">
					<ArrowUpDown size={14} className="mr-2" />
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="newest">Newest first</SelectItem>
					<SelectItem value="oldest">Oldest first</SelectItem>
				</SelectContent>
			</Select>
		</div>
	);
}

/**
 * Main content component
 */
function DownloadCenterContent() {
	const router = useRouter();
	const { downloads, isLoading, error, refetch } = useDownloads();

	// Filter/sort state
	const [searchQuery, setSearchQuery] = useState("");
	const [sortOrder, setSortOrder] = useState<SortOrder>("newest");

	// Filter and sort downloads
	const filteredDownloads = useMemo(() => {
		let result = [...downloads];

		// Search filter (client-side)
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			result = result.filter(
				(item) =>
					item.label.toLowerCase().includes(query) ||
					item.fileName.toLowerCase().includes(query),
			);
		}

		// Sort
		if (sortOrder === "oldest") {
			result.reverse();
		}

		return result;
	}, [downloads, searchQuery, sortOrder]);

	// View source handler
	const handleViewSource = (jobId: string) => {
		router.push(`/dashboard/generations?highlight=${jobId}`);
	};

	return (
		<>
			{/* Filters */}
			<div className="mb-6">
				<DownloadFilters
					searchQuery={searchQuery}
					onSearchChange={setSearchQuery}
					sortOrder={sortOrder}
					onSortChange={setSortOrder}
				/>
			</div>

			{/* Content */}
			{isLoading ? (
				<div className="space-y-3">
					<DownloadRowSkeleton />
					<DownloadRowSkeleton />
					<DownloadRowSkeleton />
					<DownloadRowSkeleton />
					<DownloadRowSkeleton />
				</div>
			) : error ? (
				<ErrorState error={error} onRetry={refetch} />
			) : downloads.length === 0 ? (
				<EmptyState />
			) : filteredDownloads.length === 0 ? (
				<NoResultsState />
			) : (
				<div className="space-y-3">
					{filteredDownloads.map((item) => (
						<DownloadRow
							key={item.id}
							item={item}
							onViewSource={handleViewSource}
						/>
					))}
				</div>
			)}
		</>
	);
}

/**
 * Loading fallback for Suspense
 */
function PageSkeleton() {
	return (
		<>
			<div className="mb-6 flex gap-3">
				<Skeleton className="h-10 flex-1" />
				<Skeleton className="h-10 w-44" />
			</div>
			<div className="space-y-3">
				<DownloadRowSkeleton />
				<DownloadRowSkeleton />
				<DownloadRowSkeleton />
			</div>
		</>
	);
}

/**
 * Main page component with Suspense boundary
 */
export default function DownloadCenterPage() {
	return (
		<div className="p-6 md:p-8">
			{/* Header */}
			<div className="mb-6">
				<h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
					Download Center
				</h1>
				<p className="mt-2 text-muted-foreground">
					All your exported PDFs in one place.
				</p>
			</div>

			<Suspense fallback={<PageSkeleton />}>
				<DownloadCenterContent />
			</Suspense>
		</div>
	);
}
