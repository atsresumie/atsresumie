"use client";

import { useState, useMemo, Suspense } from "react";
import { Plus, Search, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	useSavedJds,
	type SavedJobDescription,
	type CreateSavedJdInput,
	type UpdateSavedJdInput,
} from "@/hooks/useSavedJds";
import { SavedJdTable } from "@/components/dashboard/saved-jds/SavedJdTable";
import { SavedJdModal } from "@/components/dashboard/saved-jds/SavedJdModal";
import { DeleteSavedJdDialog } from "@/components/dashboard/saved-jds/DeleteSavedJdDialog";

type SortOrder = "newest" | "oldest";

function SavedJdsPageContent() {
	const {
		savedJds,
		isLoading,
		error,
		createSavedJd,
		updateSavedJd,
		deleteSavedJd,
		isMutating,
	} = useSavedJds();

	// UI State
	const [searchQuery, setSearchQuery] = useState("");
	const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingJd, setEditingJd] = useState<SavedJobDescription | null>(
		null,
	);
	const [deleteJd, setDeleteJd] = useState<SavedJobDescription | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	// Filter and sort saved JDs
	const filteredJds = useMemo(() => {
		let result = [...savedJds];

		// Filter by search query
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			result = result.filter(
				(jd) =>
					jd.label.toLowerCase().includes(query) ||
					(jd.company && jd.company.toLowerCase().includes(query)),
			);
		}

		// Sort
		if (sortOrder === "oldest") {
			result.reverse();
		}

		return result;
	}, [savedJds, searchQuery, sortOrder]);

	// Handlers
	const handleNewClick = () => {
		setEditingJd(null);
		setIsModalOpen(true);
	};

	const handleEdit = (jd: SavedJobDescription) => {
		setEditingJd(jd);
		setIsModalOpen(true);
	};

	const handleDelete = (jd: SavedJobDescription) => {
		setDeleteJd(jd);
	};

	const handleSave = async (
		input: CreateSavedJdInput | UpdateSavedJdInput,
	): Promise<boolean> => {
		if ("id" in input) {
			return await updateSavedJd(input);
		} else {
			const result = await createSavedJd(input);
			return !!result;
		}
	};

	const handleConfirmDelete = async () => {
		if (!deleteJd) return;

		setIsDeleting(true);
		const success = await deleteSavedJd(deleteJd.id);
		setIsDeleting(false);

		if (success) {
			setDeleteJd(null);
		}
	};

	const handleModalClose = (open: boolean) => {
		if (!open) {
			setIsModalOpen(false);
			setEditingJd(null);
		}
	};

	return (
		<>
			{/* Header */}
			<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
						Saved Job Descriptions
					</h1>
					<p className="mt-2 text-muted-foreground">
						Save and reuse job descriptions for quick resume
						generation.
					</p>
				</div>
				<Button onClick={handleNewClick} className="gap-2">
					<Plus size={18} />
					New Saved JD
				</Button>
			</div>

			{/* Filters */}
			<div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
				{/* Search */}
				<div className="relative flex-1">
					<Search
						size={16}
						className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
					/>
					<Input
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="Search by label or company..."
						className="pl-9"
					/>
				</div>

				{/* Sort */}
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button variant="outline" className="gap-2">
							<ArrowUpDown size={16} />
							{sortOrder === "newest"
								? "Newest first"
								: "Oldest first"}
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem
							onClick={() => setSortOrder("newest")}
						>
							Newest first
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={() => setSortOrder("oldest")}
						>
							Oldest first
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			{/* Error State */}
			{error && (
				<div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 p-4">
					<p className="text-sm text-red-400">{error}</p>
				</div>
			)}

			{/* Table */}
			<SavedJdTable
				savedJds={filteredJds}
				isLoading={isLoading}
				onEdit={handleEdit}
				onDelete={handleDelete}
			/>

			{/* Search results info */}
			{!isLoading &&
				searchQuery &&
				filteredJds.length !== savedJds.length && (
					<p className="mt-4 text-center text-sm text-muted-foreground">
						Showing {filteredJds.length} of {savedJds.length} saved
						JDs
					</p>
				)}

			{/* Create/Edit Modal */}
			<SavedJdModal
				open={isModalOpen}
				onOpenChange={handleModalClose}
				savedJd={editingJd}
				onSave={handleSave}
				isSaving={isMutating}
			/>

			{/* Delete Confirmation */}
			<DeleteSavedJdDialog
				open={!!deleteJd}
				onOpenChange={(open) => !open && setDeleteJd(null)}
				onConfirm={handleConfirmDelete}
				isDeleting={isDeleting}
				label={deleteJd?.label || ""}
			/>
		</>
	);
}

function SavedJdsPageSkeleton() {
	return (
		<>
			<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<Skeleton className="h-8 w-64" />
					<Skeleton className="mt-2 h-5 w-80" />
				</div>
				<Skeleton className="h-10 w-36" />
			</div>
			<div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
				<Skeleton className="h-10 flex-1" />
				<Skeleton className="h-10 w-36" />
			</div>
			<div className="rounded-xl border border-border/50 bg-card/50 overflow-hidden">
				<div className="divide-y divide-border/50">
					{[1, 2, 3].map((i) => (
						<div
							key={i}
							className="flex items-center justify-between gap-4 p-4"
						>
							<div className="flex-1 space-y-2">
								<Skeleton className="h-5 w-48" />
								<Skeleton className="h-4 w-32" />
							</div>
							<div className="flex items-center gap-2">
								<Skeleton className="h-8 w-16" />
								<Skeleton className="h-8 w-8" />
							</div>
						</div>
					))}
				</div>
			</div>
		</>
	);
}

export default function SavedJDsPage() {
	return (
		<div className="p-6 md:p-8">
			<Suspense fallback={<SavedJdsPageSkeleton />}>
				<SavedJdsPageContent />
			</Suspense>
		</div>
	);
}
