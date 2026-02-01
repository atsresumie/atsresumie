"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
	useGenerations,
	type GenerationJobFull,
	type GenerationJobStatus,
	deriveJobLabel,
} from "@/hooks/useGenerations";
import { GenerationsFilters } from "@/components/dashboard/generations/GenerationsFilters";
import { GenerationJobRow } from "@/components/dashboard/generations/GenerationJobRow";
import { GenerationDetailsDrawer } from "@/components/dashboard/generations/GenerationDetailsDrawer";
import { DeleteJobDialog } from "@/components/dashboard/generations/DeleteJobDialog";

/**
 * Loading skeleton for job rows
 */
function JobRowSkeleton() {
	return (
		<div className="flex items-center justify-between gap-4 rounded-xl border border-border/50 bg-card/50 p-4">
			<div className="min-w-0 flex-1 space-y-2">
				<Skeleton className="h-5 w-48" />
				<div className="flex items-center gap-2">
					<Skeleton className="h-5 w-20 rounded-full" />
					<Skeleton className="h-3 w-16" />
				</div>
			</div>
			<div className="flex items-center gap-2">
				<Skeleton className="h-8 w-16" />
				<Skeleton className="h-8 w-20" />
				<Skeleton className="h-8 w-20" />
				<Skeleton className="h-8 w-16" />
			</div>
		</div>
	);
}

/**
 * Empty state when no generations exist
 */
function EmptyState() {
	return (
		<div className="flex flex-col items-center justify-center py-16 text-center">
			<div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
				<Sparkles size={32} className="text-muted-foreground" />
			</div>
			<h3 className="mb-2 text-lg font-semibold text-foreground">
				No generations yet
			</h3>
			<p className="mb-6 max-w-sm text-muted-foreground">
				Generate your first ATS-optimized resume tailored to a job
				description.
			</p>
			<Link href="/dashboard/generate">
				<Button>
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
		<div className="flex flex-col items-center justify-center py-16 text-center">
			<div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
				<AlertCircle size={32} className="text-red-400" />
			</div>
			<h3 className="mb-2 text-lg font-semibold text-foreground">
				Failed to load generations
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
				No generations match your filters.
			</p>
		</div>
	);
}

export default function PastGenerationsPage() {
	const router = useRouter();
	const { jobs, isLoading, error, refetch, deleteJob, isDeleting } =
		useGenerations();

	// Filter state
	const [statusFilter, setStatusFilter] = useState<
		GenerationJobStatus | "all"
	>("all");
	const [searchQuery, setSearchQuery] = useState("");

	// Drawer state
	const [selectedJob, setSelectedJob] = useState<GenerationJobFull | null>(
		null,
	);
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);

	// Delete dialog state
	const [jobToDelete, setJobToDelete] = useState<GenerationJobFull | null>(
		null,
	);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

	// Filter jobs client-side
	const filteredJobs = useMemo(() => {
		return jobs.filter((job) => {
			// Status filter
			if (statusFilter !== "all" && job.status !== statusFilter) {
				return false;
			}

			// Search filter (search in jd_text)
			if (searchQuery.trim()) {
				const label = deriveJobLabel(job.jd_text).toLowerCase();
				const jdText = (job.jd_text || "").toLowerCase();
				const query = searchQuery.toLowerCase();
				if (!label.includes(query) && !jdText.includes(query)) {
					return false;
				}
			}

			return true;
		});
	}, [jobs, statusFilter, searchQuery]);

	// Handlers
	const handleView = (job: GenerationJobFull) => {
		setSelectedJob(job);
		setIsDrawerOpen(true);
	};

	const handleDuplicate = (job: GenerationJobFull) => {
		// Navigate to generate page with job ID (page will load JD from DB)
		router.push(`/dashboard/generate?fromJobId=${job.id}`);
	};

	const handleDeleteClick = (job: GenerationJobFull) => {
		setJobToDelete(job);
		setIsDeleteDialogOpen(true);
	};

	const handleDeleteConfirm = async () => {
		if (!jobToDelete) return;

		const success = await deleteJob(jobToDelete.id);
		if (success) {
			setIsDeleteDialogOpen(false);
			setJobToDelete(null);
		}
	};

	return (
		<div className="p-6 md:p-8">
			{/* Header */}
			<div className="mb-6">
				<h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
					Past Generations
				</h1>
				<p className="mt-2 text-muted-foreground">
					View and manage your previously generated resumes.
				</p>
			</div>

			{/* Filters */}
			<div className="mb-6">
				<GenerationsFilters
					statusFilter={statusFilter}
					onStatusFilterChange={setStatusFilter}
					searchQuery={searchQuery}
					onSearchChange={setSearchQuery}
				/>
			</div>

			{/* Content */}
			{isLoading ? (
				<div className="space-y-3">
					<JobRowSkeleton />
					<JobRowSkeleton />
					<JobRowSkeleton />
					<JobRowSkeleton />
					<JobRowSkeleton />
				</div>
			) : error ? (
				<ErrorState error={error} onRetry={refetch} />
			) : jobs.length === 0 ? (
				<EmptyState />
			) : filteredJobs.length === 0 ? (
				<NoResultsState />
			) : (
				<div className="space-y-3">
					{filteredJobs.map((job) => (
						<GenerationJobRow
							key={job.id}
							job={job}
							onView={handleView}
							onDuplicate={handleDuplicate}
							onDelete={handleDeleteClick}
						/>
					))}
				</div>
			)}

			{/* Details Drawer */}
			<GenerationDetailsDrawer
				job={selectedJob}
				open={isDrawerOpen}
				onOpenChange={setIsDrawerOpen}
			/>

			{/* Delete Confirmation */}
			<DeleteJobDialog
				open={isDeleteDialogOpen}
				onOpenChange={setIsDeleteDialogOpen}
				onConfirm={handleDeleteConfirm}
				isDeleting={isDeleting}
				jobLabel={
					jobToDelete ? deriveJobLabel(jobToDelete.jd_text) : ""
				}
			/>
		</div>
	);
}
