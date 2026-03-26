"use client";

import { useState, useCallback, useEffect } from "react";
import { FileText, ChevronDown, Plus, Check, Upload, Loader2 } from "lucide-react";
import { useResumeVersions } from "@/hooks/useResumeVersions";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { QuickUploadModal } from "./QuickUploadModal";
import { cn } from "@/lib/utils";

const ACCEPTED_TYPES = [
	"application/pdf",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const ACCEPTED_EXTENSIONS = [".pdf", ".docx"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

interface ResumeSelectorProps {
	selectedId?: string | null;
	onResumeChange?: (
		resumeId: string | null,
		objectPath: string | null,
	) => void;
}

/**
 * Resume selector with dropdown, inline upload, and drag-and-drop.
 * Shows available resume versions in a dropdown with option to upload new.
 */
export function ResumeSelector({
	selectedId: externalSelectedId,
	onResumeChange,
}: ResumeSelectorProps) {
	const { resumes, defaultResume, isLoading, error, refetch, uploadResume } =
		useResumeVersions();
	const [isUploadOpen, setIsUploadOpen] = useState(false);
	const [isDragging, setIsDragging] = useState(false);
	const [isQuickUploading, setIsQuickUploading] = useState(false);
	const [quickUploadError, setQuickUploadError] = useState<string | null>(null);

	// If parent selected a resume we don't have yet, refetch the list
	useEffect(() => {
		if (
			externalSelectedId &&
			resumes.length > 0 &&
			!resumes.some((r) => r.id === externalSelectedId)
		) {
			refetch();
		}
	}, [externalSelectedId, resumes, refetch]);

	// Use external selection if provided, otherwise use default resume
	const selectedId = externalSelectedId ?? defaultResume?.id ?? null;
	const selectedResume =
		resumes.find((r) => r.id === selectedId) || defaultResume;

	const handleSelect = (resumeId: string) => {
		const resume = resumes.find((r) => r.id === resumeId);
		if (resume) {
			onResumeChange?.(resume.id, resume.object_path);
		}
	};

	const handleUploadSuccess = (resumeId: string, objectPath: string) => {
		// Select immediately with the known objectPath
		onResumeChange?.(resumeId, objectPath);
		// Also refetch the list so the dropdown updates
		refetch();
	};

	// --- Drag and drop handlers ---
	const validateFile = useCallback((file: File): string | null => {
		const isValidType = ACCEPTED_TYPES.includes(file.type);
		const hasValidExt = ACCEPTED_EXTENSIONS.some((ext) =>
			file.name.toLowerCase().endsWith(ext),
		);
		if (!isValidType && !hasValidExt) {
			return "Please upload a PDF or DOCX file.";
		}
		if (file.size > MAX_SIZE) {
			return "File is too large. Maximum size is 5MB.";
		}
		return null;
	}, []);

	const handleDropUpload = useCallback(
		async (file: File) => {
			const validationError = validateFile(file);
			if (validationError) {
				setQuickUploadError(validationError);
				return;
			}

			setIsQuickUploading(true);
			setQuickUploadError(null);

			try {
				const label = file.name.replace(/\.[^/.]+$/, "").slice(0, 50);
				const result = await uploadResume(file, label);
				if (result) {
					onResumeChange?.(result.id, result.object_path);
					refetch();
				} else {
					setQuickUploadError("Upload failed. Please try again.");
				}
			} catch (err) {
				console.error("Drop upload error:", err);
				setQuickUploadError(
					err instanceof Error ? err.message : "Upload failed",
				);
			} finally {
				setIsQuickUploading(false);
			}
		},
		[validateFile, uploadResume, onResumeChange, refetch],
	);

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(true);
	}, []);

	const handleDragLeave = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(false);
	}, []);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			e.stopPropagation();
			setIsDragging(false);

			const files = e.dataTransfer.files;
			if (files.length > 0) {
				handleDropUpload(files[0]);
			}
		},
		[handleDropUpload],
	);

	if (isLoading) {
		return (
			<div className="rounded-lg border border-border/50 bg-muted/20 p-4">
				<div className="flex items-center gap-3">
					<Skeleton className="h-10 w-10 rounded-lg" />
					<div className="space-y-2 flex-1">
						<Skeleton className="h-4 w-32" />
						<Skeleton className="h-3 w-48" />
					</div>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4">
				<p className="text-sm text-red-400">{error}</p>
			</div>
		);
	}

	// No resumes yet - show drag-and-drop upload zone
	if (resumes.length === 0) {
		return (
			<>
				<div
					className={cn(
						"rounded-lg border-2 border-dashed p-6 text-center transition-colors cursor-pointer",
						isDragging
							? "border-primary bg-primary/5"
							: "border-border hover:border-primary/50",
						isQuickUploading && "opacity-60 pointer-events-none",
					)}
					onDragOver={handleDragOver}
					onDragLeave={handleDragLeave}
					onDrop={handleDrop}
					onClick={() => !isQuickUploading && setIsUploadOpen(true)}
				>
					{isQuickUploading ? (
						<>
							<Loader2 className="mx-auto h-8 w-8 text-primary animate-spin mb-2" />
							<p className="text-sm font-medium">Uploading…</p>
						</>
					) : (
						<>
							<Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
							<p className="text-sm font-medium">
								{isDragging
									? "Drop your resume here"
									: "Drag & drop or click to upload"}
							</p>
							<p className="text-xs text-muted-foreground mt-1">
								PDF or DOCX, max 5MB
							</p>
						</>
					)}
				</div>
				{quickUploadError && (
					<p className="mt-2 text-xs text-red-400">{quickUploadError}</p>
				)}
				<QuickUploadModal
					open={isUploadOpen}
					onClose={() => setIsUploadOpen(false)}
					onUploadSuccess={handleUploadSuccess}
				/>
			</>
		);
	}

	return (
		<>
			{/* Drop overlay for replacing resume when resumes exist */}
			<div
				className={cn(
					"relative rounded-lg transition-all",
					isDragging && "ring-2 ring-primary ring-offset-2 ring-offset-background",
				)}
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				onDrop={handleDrop}
			>
				{/* Drag overlay */}
				{isDragging && (
					<div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg border-2 border-dashed border-primary bg-primary/10 backdrop-blur-sm">
						<div className="text-center">
							<Upload className="mx-auto h-6 w-6 text-primary mb-1" />
							<p className="text-sm font-medium text-primary">
								Drop to upload
							</p>
						</div>
					</div>
				)}

				<div className="flex gap-2">
					{/* Dropdown Selector */}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<button className="flex-1 rounded-lg border border-border/50 bg-card/50 p-4 text-left hover:border-border transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50">
								<div className="flex items-center justify-between gap-3">
									<div className="flex items-center gap-3 min-w-0">
										<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 flex-shrink-0">
											<FileText
												size={20}
												className="text-emerald-400"
											/>
										</div>
										<div className="min-w-0">
											<p className="font-medium text-sm truncate text-foreground">
												{selectedResume?.label ||
													selectedResume?.file_name ||
													"Select resume"}
											</p>
											<p className="text-xs text-muted-foreground">
												{selectedResume
													? "Click to change"
													: "Choose from your resumes"}
											</p>
										</div>
									</div>
									<ChevronDown
										size={16}
										className="text-muted-foreground flex-shrink-0"
									/>
								</div>
							</button>
						</DropdownMenuTrigger>

						<DropdownMenuContent align="start" className="w-[300px]">
							{resumes.map((resume) => (
								<DropdownMenuItem
									key={resume.id}
									onClick={() => handleSelect(resume.id)}
									className="flex items-center gap-3 py-3"
								>
									<FileText
										size={16}
										className="text-muted-foreground"
									/>
									<div className="flex-1 min-w-0">
										<p className="text-sm font-medium truncate">
											{resume.label || resume.file_name}
										</p>
										<p className="text-xs text-muted-foreground">
											{resume.is_default && "Default • "}
											{resume.file_type?.toUpperCase()}
										</p>
									</div>
									{resume.id === selectedId && (
										<Check
											size={16}
											className="text-emerald-400"
										/>
									)}
								</DropdownMenuItem>
							))}

							<DropdownMenuSeparator />

							<DropdownMenuItem
								onClick={() => setIsUploadOpen(true)}
								className="flex items-center gap-3 py-3 text-primary"
							>
								<Plus size={16} />
								<span className="font-medium">
									Upload new resume
								</span>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>

					{/* Upload Button */}
					<Button
						variant="outline"
						onClick={() => setIsUploadOpen(true)}
						disabled={isQuickUploading}
						className="flex-shrink-0 gap-2 h-auto py-4 px-4 border-border/50 bg-card/50 hover:bg-primary/5 hover:border-primary/50"
					>
						{isQuickUploading ? (
							<Loader2 size={18} className="text-primary animate-spin" />
						) : (
							<Plus size={18} className="text-primary" />
						)}
						<span className="text-foreground font-medium">
							{isQuickUploading ? "Uploading…" : "Upload New"}
						</span>
					</Button>
				</div>
			</div>

			{quickUploadError && (
				<p className="mt-2 text-xs text-red-400">{quickUploadError}</p>
			)}

			{isQuickUploading && (
				<p className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
					<Loader2 size={12} className="animate-spin" />
					Uploading dropped file…
				</p>
			)}

			<QuickUploadModal
				open={isUploadOpen}
				onClose={() => setIsUploadOpen(false)}
				onUploadSuccess={handleUploadSuccess}
			/>
		</>
	);
}
