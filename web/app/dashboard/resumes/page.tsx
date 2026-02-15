"use client";

import { useState, Suspense } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
	useResumeVersions,
	type ResumeVersion,
} from "@/hooks/useResumeVersions";
import { UploadResumeModal } from "@/components/dashboard/resumes/UploadResumeModal";
import { DeleteResumeDialog } from "@/components/dashboard/resumes/DeleteResumeDialog";
import { ViewResumeTextModal } from "@/components/dashboard/resumes/ViewResumeTextModal";
import { ResumeVersionsTable } from "@/components/dashboard/resumes/ResumeVersionsTable";

function PageSkeleton() {
	return (
		<div className="space-y-6">
			{/* Header skeleton */}
			<div className="flex items-center justify-between">
				<div>
					<Skeleton className="h-8 w-48 mb-2" />
					<Skeleton className="h-4 w-64" />
				</div>
				<Skeleton className="h-10 w-40" />
			</div>
			{/* List skeleton */}
			<div className="rounded-lg border border-border/50 bg-card/50 divide-y divide-border/30">
				{[1, 2, 3].map((i) => (
					<div key={i} className="flex items-center gap-4 p-4">
						<Skeleton className="h-10 w-10 rounded-lg" />
						<div className="flex-1 space-y-2">
							<Skeleton className="h-4 w-48" />
							<Skeleton className="h-3 w-32" />
						</div>
						<Skeleton className="h-8 w-8 rounded-md" />
					</div>
				))}
			</div>
		</div>
	);
}

function ResumeVersionsContent() {
	const {
		resumes,
		isLoading,
		error,
		uploadResume,
		setDefault,
		deleteResume,
		isMutating,
	} = useResumeVersions();

	// Modal/dialog states
	const [uploadModalOpen, setUploadModalOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [viewTextModalOpen, setViewTextModalOpen] = useState(false);
	const [selectedResume, setSelectedResume] = useState<ResumeVersion | null>(
		null,
	);
	const [isDeleting, setIsDeleting] = useState(false);

	// Handlers
	const handleSetDefault = async (resume: ResumeVersion) => {
		await setDefault(resume.id);
	};

	const handleViewText = (resume: ResumeVersion) => {
		setSelectedResume(resume);
		setViewTextModalOpen(true);
	};

	const handleDeleteClick = (resume: ResumeVersion) => {
		setSelectedResume(resume);
		setDeleteDialogOpen(true);
	};

	const handleDeleteConfirm = async () => {
		if (!selectedResume) return;

		setIsDeleting(true);
		const success = await deleteResume(selectedResume.id);
		setIsDeleting(false);

		if (success) {
			setDeleteDialogOpen(false);
			setSelectedResume(null);
		}
	};

	const handleUpload = async (file: File, label?: string) => {
		return await uploadResume(file, label);
	};

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div>
					<h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
						Resume Versions
					</h1>
					<p className="mt-1 text-muted-foreground">
						Manage your resume versions and set your default resume.
					</p>
				</div>
				<Button
					onClick={() => setUploadModalOpen(true)}
					disabled={isMutating}
				>
					<Plus className="mr-2 h-4 w-4" />
					Upload new resume
				</Button>
			</div>

			{/* Error message */}
			{error && (
				<div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4">
					<p className="text-sm text-red-400">{error}</p>
				</div>
			)}

			{/* Resume list */}
			<ResumeVersionsTable
				resumes={resumes}
				isLoading={isLoading}
				onSetDefault={handleSetDefault}
				onViewText={handleViewText}
				onDelete={handleDeleteClick}
			/>

			{/* Upload modal */}
			<UploadResumeModal
				open={uploadModalOpen}
				onOpenChange={setUploadModalOpen}
				onUpload={handleUpload}
			/>

			{/* Delete confirmation dialog */}
			<DeleteResumeDialog
				open={deleteDialogOpen}
				onOpenChange={setDeleteDialogOpen}
				resumeLabel={selectedResume?.label || ""}
				isDefault={selectedResume?.is_default || false}
				isDeleting={isDeleting}
				onConfirm={handleDeleteConfirm}
			/>

			{/* View text modal */}
			<ViewResumeTextModal
				open={viewTextModalOpen}
				onOpenChange={setViewTextModalOpen}
				resumeLabel={selectedResume?.label || ""}
				resumeText={selectedResume?.resume_text || null}
			/>
		</div>
	);
}

export default function ResumeVersionsPage() {
	return (
		<div className="p-6 md:p-8">
			<Suspense fallback={<PageSkeleton />}>
				<ResumeVersionsContent />
			</Suspense>
		</div>
	);
}
