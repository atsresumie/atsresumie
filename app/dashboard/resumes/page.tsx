"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { Upload, FileText, Eye, Download, ChevronDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
	useResumeVersions,
	getRelativeTime,
	type ResumeVersion,
} from "@/hooks/useResumeVersions";
import { useCredits } from "@/hooks/useCredits";
import { UploadResumeModal } from "@/components/dashboard/resumes/UploadResumeModal";
import { DeleteResumeDialog } from "@/components/dashboard/resumes/DeleteResumeDialog";
import { ViewResumeTextModal } from "@/components/dashboard/resumes/ViewResumeTextModal";

function PageSkeleton() {
	return (
		<div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6" style={{ maxWidth: "1128px", margin: "0 auto" }}>
			<div className="space-y-6">
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					{[1, 2, 3, 4].map((i) => (
						<Skeleton key={i} className="h-44 w-full rounded-xl" />
					))}
				</div>
				<Skeleton className="h-32 w-full rounded-xl" />
			</div>
			<div className="space-y-4">
				<Skeleton className="h-80 w-full rounded-xl" />
				<Skeleton className="h-20 w-full rounded-xl" />
			</div>
		</div>
	);
}

function ResumeVersionsContent() {
	const {
		resumes,
		defaultResume,
		isLoading,
		error,
		uploadResume,
		setDefault,
		deleteResume,
		isMutating,
	} = useResumeVersions();
	const { credits } = useCredits();

	// Modal/dialog states
	const [uploadModalOpen, setUploadModalOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [viewTextModalOpen, setViewTextModalOpen] = useState(false);
	const [selectedResume, setSelectedResume] = useState<ResumeVersion | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	// Quick tailor state
	const [quickJd, setQuickJd] = useState("");
	const [quickResumeId, setQuickResumeId] = useState<string | null>(null);

	// Auto-select default resume for quick tailor
	const quickResume = quickResumeId
		? resumes.find((r) => r.id === quickResumeId)
		: defaultResume;

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

	// Find most recent update time
	const lastUpdated = resumes.length > 0 ? getRelativeTime(resumes[0].updated_at) : null;

	return (
		<div
			className="grid grid-cols-1 lg:grid-cols-[1fr_320px] items-start mx-auto"
			style={{ maxWidth: "1128px", gap: "24px" }}
		>
			{/* LEFT — Resume Cards Grid + Upload */}
			<div className="space-y-6">
				{/* Error */}
				{error && (
					<div className="rounded-lg border border-error/20 bg-error-muted p-3">
						<p className="text-sm text-error">{error}</p>
					</div>
				)}

				{/* Cards grid */}
				{resumes.length > 0 ? (
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						{resumes.map((resume) => (
							<ResumeCard
								key={resume.id}
								resume={resume}
								onPreview={handleViewText}
								onDelete={handleDeleteClick}
								onSetDefault={handleSetDefault}
							/>
						))}
					</div>
				) : (
					<div className="text-center py-12 text-text-tertiary text-sm">
						No resumes uploaded yet. Upload your first resume below.
					</div>
				)}

				{/* Upload area */}
				<div
					className="rounded-xl border-2 border-dashed border-border-visible py-10 px-6 text-center cursor-pointer hover:border-accent/40 transition-colors"
					onClick={() => setUploadModalOpen(true)}
				>
					<Upload className="mx-auto h-7 w-7 text-text-tertiary mb-2" />
					<p className="text-base font-semibold text-text-primary">
						Upload New Resume or Tailor Existing
					</p>
					<p className="text-sm text-text-tertiary mt-1">
						PDF or DOCX · Drag & drop or click to browse
					</p>
				</div>
			</div>

			{/* RIGHT — Quick Tailor sidebar */}
			<div className="space-y-4 lg:sticky lg:top-20">
				<div className="rounded-xl border border-border-visible bg-surface-raised p-5">
					<h3 className="text-lg font-semibold text-text-primary font-body">
						Quick Tailor
					</h3>
					<p className="text-xs text-text-tertiary mt-0.5 mb-4">
						Select a resume + paste a JD to get started
					</p>

					{/* 1. Choose base resume */}
					<div className="mb-4">
						<label className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
							<span className="w-5 h-5 rounded-full bg-text-primary text-white text-xs flex items-center justify-center font-bold">1</span>
							Choose base resume
						</label>
						<select
							value={quickResume?.id || ""}
							onChange={(e) => setQuickResumeId(e.target.value || null)}
							className="w-full mt-2 h-10 px-3 rounded-lg border border-border-visible bg-surface-raised text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
						>
							{resumes.map((r) => (
								<option key={r.id} value={r.id}>
									{r.label}
								</option>
							))}
						</select>
					</div>

					{/* 2. Paste job description */}
					<div className="mb-4">
						<label className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
							<span className="w-5 h-5 rounded-full bg-text-primary text-white text-xs flex items-center justify-center font-bold">2</span>
							Paste job description
						</label>
						<Textarea
							value={quickJd}
							onChange={(e) => setQuickJd(e.target.value)}
							placeholder="Paste the full job description"
							rows={6}
							className="mt-2 resize-none text-sm border-border-visible bg-surface-raised"
						/>
					</div>

					{/* Generate button */}
					<Link
						href={`/dashboard/generate${quickJd.trim() ? "" : ""}`}
						onClick={() => {
							if (quickJd.trim()) {
								try {
									localStorage.setItem("atsresumie_generate_prefill_jd", quickJd.trim());
								} catch {}
							}
						}}
					>
						<button
							className="w-full py-3 rounded-full text-sm font-semibold text-white bg-cta hover:bg-cta-hover transition-colors"
						>
							Generate Tailor Resume
						</button>
					</Link>
				</div>

				{/* Credits info */}
				{credits !== null && (
					<div className="rounded-xl border border-border-visible bg-surface-raised p-4">
						<p className="text-sm font-semibold text-text-primary">
							{credits} credits Remaining
						</p>
						<p className="text-xs text-text-tertiary mt-0.5">
							1 credit per generation · Resets monthly
						</p>
					</div>
				)}
			</div>

			{/* Modals */}
			<UploadResumeModal
				open={uploadModalOpen}
				onOpenChange={setUploadModalOpen}
				onUpload={handleUpload}
			/>
			<DeleteResumeDialog
				open={deleteDialogOpen}
				onOpenChange={setDeleteDialogOpen}
				resumeLabel={selectedResume?.label || ""}
				isDefault={selectedResume?.is_default || false}
				isDeleting={isDeleting}
				onConfirm={handleDeleteConfirm}
			/>
			<ViewResumeTextModal
				open={viewTextModalOpen}
				onOpenChange={setViewTextModalOpen}
				resumeLabel={selectedResume?.label || ""}
				resumeText={selectedResume?.resume_text || null}
			/>
		</div>
	);
}

// ─── Resume Card ────────────────────────────────────────────────────────────

function ResumeCard({
	resume,
	onPreview,
	onDelete,
	onSetDefault,
}: {
	resume: ResumeVersion;
	onPreview: (r: ResumeVersion) => void;
	onDelete: (r: ResumeVersion) => void;
	onSetDefault: (r: ResumeVersion) => void;
}) {
	return (
		<div className="rounded-xl border border-border-visible bg-surface-raised p-4 flex flex-col">
			{/* Top row: icon + name */}
			<div className="flex items-start gap-3 mb-3">
				<div className="w-10 h-10 rounded-lg bg-surface-inset border border-border-subtle flex items-center justify-center flex-shrink-0">
					<FileText size={18} className="text-text-tertiary" />
				</div>
				<div className="min-w-0 flex-1">
					<p className="text-sm font-semibold text-text-primary truncate">
						{resume.label}
					</p>
					<p className="text-xs text-text-secondary truncate mt-0.5">
						Tailored for {resume.file_name}
					</p>
				</div>
			</div>

			{/* Badges */}
			<div className="flex items-center gap-2 mb-3">
				{resume.is_default && (
					<span className="text-[10px] font-medium px-2 py-0.5 rounded border border-accent/30 text-accent bg-accent-muted">
						Active
					</span>
				)}
				<span className="text-[10px] font-medium px-2 py-0.5 rounded border border-success/30 text-success bg-success-muted">
					ATS 96%
				</span>
			</div>

			{/* Date */}
			<p className="text-xs text-text-tertiary mb-3">
				Updated {getRelativeTime(resume.updated_at)}
			</p>

			{/* Actions */}
			<div className="flex items-center gap-2 mt-auto">
				<button
					onClick={() => onPreview(resume)}
					className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border-visible text-xs font-medium text-text-primary hover:bg-surface-inset transition-colors"
				>
					Preview
				</button>
				<button
					className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-white bg-accent hover:bg-accent-hover transition-colors"
				>
					Download PDF
				</button>
			</div>
		</div>
	);
}

export default function ResumeVersionsPage() {
	return (
		<div className="applications-page p-6 md:p-8 min-h-screen" style={{ backgroundColor: "var(--surface-base)" }}>
			{/* Header */}
			<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between" style={{ maxWidth: "1128px", margin: "0 auto 1.5rem" }}>
				<div>
					<h1 className="text-2xl font-semibold tracking-tight text-text-primary md:text-3xl">
						My Resumes
					</h1>
					<p className="mt-1.5 text-sm text-text-secondary">
						<Suspense fallback="Loading...">
							<ResumeStats />
						</Suspense>
					</p>
				</div>
				<Link
					href="/dashboard/generate"
					className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-accent hover:bg-accent-hover transition-colors flex-shrink-0"
				>
					Tailor New Version
				</Link>
			</div>

			<Suspense fallback={<PageSkeleton />}>
				<ResumeVersionsContent />
			</Suspense>
		</div>
	);
}

function ResumeStats() {
	const { resumes } = useResumeVersions();
	const lastUpdated = resumes.length > 0 ? getRelativeTime(resumes[0].updated_at) : null;
	return (
		<>
			{resumes.length} saved version{resumes.length !== 1 ? "s" : ""}
			{lastUpdated && ` · Last tailored ${lastUpdated}`}
		</>
	);
}
