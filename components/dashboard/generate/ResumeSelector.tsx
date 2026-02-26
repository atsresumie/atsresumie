"use client";

import { useState } from "react";
import { FileText, ChevronDown, Plus, Check } from "lucide-react";
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

interface ResumeSelectorProps {
	selectedId?: string | null;
	onResumeChange?: (
		resumeId: string | null,
		objectPath: string | null,
	) => void;
}

/**
 * Resume selector with dropdown and inline upload.
 * Shows available resume versions in a dropdown with option to upload new.
 */
export function ResumeSelector({
	selectedId: externalSelectedId,
	onResumeChange,
}: ResumeSelectorProps) {
	const { resumes, defaultResume, isLoading, error, refetch } =
		useResumeVersions();
	const [isUploadOpen, setIsUploadOpen] = useState(false);

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

	// No resumes yet - show upload prompt
	if (resumes.length === 0) {
		return (
			<>
				<div className="rounded-lg border border-dashed border-border p-6 text-center">
					<FileText className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
					<p className="text-sm font-medium mb-1">
						No resumes uploaded
					</p>
					<p className="text-xs text-muted-foreground mb-4">
						Upload a resume to get started
					</p>
					<Button size="sm" onClick={() => setIsUploadOpen(true)}>
						<Plus size={16} className="mr-2" />
						Upload Resume
					</Button>
				</div>
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

				{/* Upload Button - Always visible */}
				<Button
					variant="outline"
					onClick={() => setIsUploadOpen(true)}
					className="flex-shrink-0 gap-2 h-auto py-4 px-4 border-border/50 bg-card/50 hover:bg-primary/5 hover:border-primary/50"
				>
					<Plus size={18} className="text-primary" />
					<span className="text-foreground font-medium">
						Upload New
					</span>
				</Button>
			</div>

			<QuickUploadModal
				open={isUploadOpen}
				onClose={() => setIsUploadOpen(false)}
				onUploadSuccess={handleUploadSuccess}
			/>
		</>
	);
}
