"use client";

import { FileText, MoreVertical, Star, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type { ResumeVersion } from "@/hooks/useResumeVersions";
import { getRelativeTime } from "@/hooks/useResumeVersions";

interface ResumeVersionsTableProps {
	resumes: ResumeVersion[];
	isLoading: boolean;
	onSetDefault: (resume: ResumeVersion) => void;
	onViewText: (resume: ResumeVersion) => void;
	onDelete: (resume: ResumeVersion) => void;
}

function SkeletonRow() {
	return (
		<div className="flex items-center gap-4 p-4 border-b border-border/30 last:border-0">
			<Skeleton className="h-10 w-10 rounded-lg" />
			<div className="flex-1 space-y-2">
				<Skeleton className="h-4 w-48" />
				<Skeleton className="h-3 w-32" />
			</div>
			<Skeleton className="h-8 w-8 rounded-md" />
		</div>
	);
}

function EmptyState() {
	return (
		<div className="flex flex-col items-center justify-center py-12 text-center">
			<div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted/50 mb-4">
				<FileText className="h-7 w-7 text-muted-foreground" />
			</div>
			<h3 className="text-lg font-medium text-foreground mb-1">
				No resumes uploaded
			</h3>
			<p className="text-sm text-muted-foreground max-w-sm">
				Upload your first resume to get started. You can upload multiple
				versions and set a default for generating tailored resumes.
			</p>
		</div>
	);
}

function ResumeRow({
	resume,
	onSetDefault,
	onViewText,
	onDelete,
}: {
	resume: ResumeVersion;
	onSetDefault: (resume: ResumeVersion) => void;
	onViewText: (resume: ResumeVersion) => void;
	onDelete: (resume: ResumeVersion) => void;
}) {
	return (
		<div className="flex items-center gap-4 p-4 border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors">
			{/* Icon */}
			<div
				className={`flex h-10 w-10 items-center justify-center rounded-lg ${
					resume.is_default ? "bg-emerald-500/10" : "bg-muted/50"
				}`}
			>
				<FileText
					className={`h-5 w-5 ${
						resume.is_default
							? "text-emerald-400"
							: "text-muted-foreground"
					}`}
				/>
			</div>

			{/* Info */}
			<div className="flex-1 min-w-0">
				<div className="flex items-center gap-2">
					<p className="font-medium text-foreground truncate">
						{resume.label}
					</p>
					{resume.is_default && (
						<Badge
							variant="secondary"
							className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
						>
							Default
						</Badge>
					)}
				</div>
				<p className="text-sm text-muted-foreground truncate">
					{resume.file_name} • {getRelativeTime(resume.created_at)}
				</p>
			</div>

			{/* Actions dropdown */}
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="ghost" size="icon">
						<MoreVertical className="h-4 w-4" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					{!resume.is_default && (
						<DropdownMenuItem onClick={() => onSetDefault(resume)}>
							<Star className="mr-2 h-4 w-4" />
							Set as default
						</DropdownMenuItem>
					)}
					<DropdownMenuItem onClick={() => onViewText(resume)}>
						<Eye className="mr-2 h-4 w-4" />
						View extracted text
					</DropdownMenuItem>
					<DropdownMenuItem
						onClick={() => onDelete(resume)}
						className="text-red-400 focus:text-red-400"
					>
						<Trash2 className="mr-2 h-4 w-4" />
						Delete
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}

export function ResumeVersionsTable({
	resumes,
	isLoading,
	onSetDefault,
	onViewText,
	onDelete,
}: ResumeVersionsTableProps) {
	if (isLoading) {
		return (
			<div className="rounded-lg border border-border/50 bg-card/50 divide-y divide-border/30">
				<SkeletonRow />
				<SkeletonRow />
				<SkeletonRow />
			</div>
		);
	}

	if (resumes.length === 0) {
		return (
			<div className="rounded-lg border border-border/50 bg-card/50">
				<EmptyState />
			</div>
		);
	}

	return (
		<div className="rounded-lg border border-border/50 bg-card/50">
			{resumes.map((resume) => (
				<ResumeRow
					key={resume.id}
					resume={resume}
					onSetDefault={onSetDefault}
					onViewText={onViewText}
					onDelete={onDelete}
				/>
			))}
		</div>
	);
}
