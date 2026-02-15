"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
	MoreHorizontal,
	Sparkles,
	Pencil,
	Trash2,
	Building2,
	ExternalLink,
} from "lucide-react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { SavedJobDescription } from "@/hooks/useSavedJds";
import { getRelativeTime } from "@/hooks/useSavedJds";

// localStorage key for prefilling generate page
const PREFILL_JD_KEY = "atsresumie_generate_prefill_jd";

interface SavedJdTableProps {
	savedJds: SavedJobDescription[];
	isLoading: boolean;
	onEdit: (jd: SavedJobDescription) => void;
	onDelete: (jd: SavedJobDescription) => void;
}

export function SavedJdTable({
	savedJds,
	isLoading,
	onEdit,
	onDelete,
}: SavedJdTableProps) {
	const router = useRouter();

	const handleUse = (jd: SavedJobDescription) => {
		// Store JD in localStorage for the generate page to consume
		if (typeof window !== "undefined") {
			localStorage.setItem(PREFILL_JD_KEY, jd.jd_text);
		}
		router.push("/dashboard/generate");
	};

	if (isLoading) {
		return <SavedJdTableSkeleton />;
	}

	if (savedJds.length === 0) {
		return (
			<div className="rounded-xl border border-border/50 bg-card/50 p-12 text-center">
				<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
					<Sparkles size={24} className="text-muted-foreground" />
				</div>
				<h3 className="text-lg font-medium text-foreground">
					No saved job descriptions
				</h3>
				<p className="mt-2 text-sm text-muted-foreground">
					Save job descriptions to quickly reuse them when generating
					tailored resumes.
				</p>
			</div>
		);
	}

	return (
		<div className="rounded-xl border border-border/50 bg-card/50 overflow-hidden">
			<div className="divide-y divide-border/50">
				{savedJds.map((jd) => (
					<SavedJdRow
						key={jd.id}
						savedJd={jd}
						onUse={() => handleUse(jd)}
						onEdit={() => onEdit(jd)}
						onDelete={() => onDelete(jd)}
					/>
				))}
			</div>
		</div>
	);
}

interface SavedJdRowProps {
	savedJd: SavedJobDescription;
	onUse: () => void;
	onEdit: () => void;
	onDelete: () => void;
}

function SavedJdRow({ savedJd, onUse, onEdit, onDelete }: SavedJdRowProps) {
	const [isMenuOpen, setIsMenuOpen] = useState(false);

	return (
		<div className="flex items-center justify-between gap-4 p-4 hover:bg-muted/20 transition-colors">
			{/* Left: Info */}
			<div className="min-w-0 flex-1">
				<div className="flex items-center gap-2">
					<h3 className="font-medium text-foreground truncate">
						{savedJd.label}
					</h3>
					{savedJd.source_url && (
						<a
							href={savedJd.source_url}
							target="_blank"
							rel="noopener noreferrer"
							className="text-muted-foreground hover:text-foreground transition-colors"
							onClick={(e) => e.stopPropagation()}
						>
							<ExternalLink size={14} />
						</a>
					)}
				</div>
				<div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
					{savedJd.company && (
						<span className="flex items-center gap-1">
							<Building2 size={12} />
							{savedJd.company}
						</span>
					)}
					<span>{getRelativeTime(savedJd.updated_at)}</span>
					<span className="text-xs">
						{savedJd.jd_text.length.toLocaleString()} chars
					</span>
				</div>
			</div>

			{/* Right: Actions */}
			<div className="flex items-center gap-2">
				<Button size="sm" onClick={onUse} className="gap-1.5">
					<Sparkles size={14} />
					Use
				</Button>
				<DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
					<DropdownMenuTrigger asChild>
						<Button variant="ghost" size="icon" className="h-8 w-8">
							<MoreHorizontal size={16} />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem onClick={onEdit}>
							<Pencil size={14} className="mr-2" />
							Edit
						</DropdownMenuItem>
						<DropdownMenuItem
							onClick={onDelete}
							className="text-red-400 focus:text-red-400"
						>
							<Trash2 size={14} className="mr-2" />
							Delete
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</div>
	);
}

function SavedJdTableSkeleton() {
	return (
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
	);
}
