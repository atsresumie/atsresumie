"use client";

import { useState, Suspense } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
	useJobApplications,
	type JobApplication,
	type CreateApplicationInput,
	type UpdateApplicationInput,
	type ApplicationStage,
} from "@/hooks/useJobApplications";
import { ApplicationBoard } from "@/components/dashboard/applications/ApplicationBoard";
import { ApplicationModal } from "@/components/dashboard/applications/ApplicationModal";
import { ApplicationDetailModal } from "@/components/dashboard/applications/ApplicationDetailModal";
import { DeleteApplicationDialog } from "@/components/dashboard/applications/DeleteApplicationDialog";

function ApplicationsPageContent() {
	const {
		applications,
		isLoading,
		error,
		createApplication,
		updateApplication,
		deleteApplication,
		moveApplication,
		isMutating,
	} = useJobApplications();

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [editingApp, setEditingApp] = useState<JobApplication | null>(null);
	const [viewingApp, setViewingApp] = useState<JobApplication | null>(null);
	const [deletingApp, setDeletingApp] = useState<JobApplication | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	// Stats
	const total = applications.length;
	const interviewCount = applications.filter(
		(a) => a.stage === "interview",
	).length;
	const offerCount = applications.filter((a) => a.stage === "offer").length;

	// Handlers
	const handleAdd = () => {
		setEditingApp(null);
		setIsModalOpen(true);
	};

	const handleView = (app: JobApplication) => {
		setViewingApp(app);
	};

	const handleEdit = (app: JobApplication) => {
		setEditingApp(app);
		setIsModalOpen(true);
	};

	const handleDelete = (app: JobApplication) => {
		setDeletingApp(app);
	};

	const handleMove = async (id: string, newStage: ApplicationStage) => {
		await moveApplication(id, newStage);
	};

	const handleSave = async (
		input: CreateApplicationInput | UpdateApplicationInput,
	): Promise<boolean> => {
		if ("id" in input) {
			return await updateApplication(input);
		} else {
			const result = await createApplication(input);
			return !!result;
		}
	};

	const handleConfirmDelete = async () => {
		if (!deletingApp) return;
		setIsDeleting(true);
		const success = await deleteApplication(deletingApp.id);
		setIsDeleting(false);
		if (success) {
			setDeletingApp(null);
		}
	};

	if (isLoading) {
		return <ApplicationsPageSkeleton />;
	}

	return (
		<>
			{/* Header */}
			<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
						My Applications
					</h1>
					<div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
						<span>{total} total</span>
						<span className="w-px h-3 bg-border-visible" />
						<span>{interviewCount} interviews</span>
						<span className="w-px h-3 bg-border-visible" />
						<span>{offerCount} offers</span>
					</div>
				</div>
				<Button onClick={handleAdd} className="gap-2">
					<Plus size={18} />
					Add Application
				</Button>
			</div>

			{/* Error */}
			{error && (
				<div className="mb-6 rounded-lg border border-error/20 bg-error-muted p-4">
					<p className="text-sm text-error">{error}</p>
				</div>
			)}

			{/* Board */}
			<ApplicationBoard
				applications={applications}
				onView={handleView}
				onEdit={handleEdit}
				onDelete={handleDelete}
				onMove={handleMove}
				onAdd={handleAdd}
			/>

			{/* Detail modal — opens on card click */}
			<ApplicationDetailModal
				open={!!viewingApp}
				onOpenChange={(open) => !open && setViewingApp(null)}
				application={viewingApp}
				onEdit={handleEdit}
			/>

			{/* Edit/Create modal */}
			<ApplicationModal
				open={isModalOpen}
				onOpenChange={(open) => {
					if (!open) {
						setIsModalOpen(false);
						setEditingApp(null);
					}
				}}
				application={editingApp}
				onSave={handleSave}
				isSaving={isMutating}
			/>

			{/* Delete dialog */}
			<DeleteApplicationDialog
				open={!!deletingApp}
				onOpenChange={(open) => !open && setDeletingApp(null)}
				onConfirm={handleConfirmDelete}
				isDeleting={isDeleting}
				company={deletingApp?.company || ""}
				role={deletingApp?.role || ""}
			/>
		</>
	);
}

function ApplicationsPageSkeleton() {
	return (
		<>
			<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<Skeleton className="h-8 w-52" />
					<Skeleton className="mt-2 h-5 w-48" />
				</div>
				<Skeleton className="h-10 w-40" />
			</div>
			<div className="flex gap-3">
				{[1, 2, 3, 4, 5].map((i) => (
					<div key={i} className="flex-1 min-w-[180px]">
						<Skeleton className="h-10 w-full rounded-t-xl" />
						<div className="p-2 space-y-2">
							<Skeleton className="h-24 w-full rounded-lg" />
							<Skeleton className="h-24 w-full rounded-lg" />
						</div>
					</div>
				))}
			</div>
		</>
	);
}

export default function ApplicationsPage() {
	return (
		<div className="p-6 md:p-8">
			<Suspense fallback={<ApplicationsPageSkeleton />}>
				<ApplicationsPageContent />
			</Suspense>
		</div>
	);
}
