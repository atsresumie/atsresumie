"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
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
			<div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight text-text-primary md:text-3xl">
						My Applications
					</h1>
					<p className="mt-1.5 text-sm text-text-secondary">
						{total} total · {interviewCount} active interview{interviewCount !== 1 ? "s" : ""} · {offerCount} offer{offerCount !== 1 ? "s" : ""} pending decision
					</p>
				</div>
				<div className="flex items-center gap-3">
					<button
						onClick={handleAdd}
						className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border-visible text-sm font-medium text-text-primary bg-surface-raised hover:bg-surface-inset transition-colors"
					>
						Add <Plus size={14} />
					</button>
					<Link
						href="/dashboard/generate"
						className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-accent hover:bg-accent-hover transition-colors"
					>
						Tailor & Apply
					</Link>
				</div>
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
			<div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<Skeleton className="h-8 w-52" />
					<Skeleton className="mt-2 h-5 w-48" />
				</div>
				<div className="flex gap-3">
					<Skeleton className="h-10 w-24" />
					<Skeleton className="h-10 w-36" />
				</div>
			</div>
			<div className="flex gap-4">
				{[1, 2, 3, 4].map((i) => (
					<div key={i} className="flex-1 min-w-[200px]">
						<Skeleton className="h-10 w-full rounded-t-xl" />
						<div className="p-3 space-y-3">
							<Skeleton className="h-28 w-full rounded-lg" />
							<Skeleton className="h-28 w-full rounded-lg" />
						</div>
					</div>
				))}
			</div>
		</>
	);
}

export default function ApplicationsPage() {
	return (
		<div className="applications-page p-6 md:p-8 min-h-screen" style={{ backgroundColor: "var(--surface-base)" }}>
			<Suspense fallback={<ApplicationsPageSkeleton />}>
				<ApplicationsPageContent />
			</Suspense>
		</div>
	);
}
