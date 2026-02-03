"use client";

import Link from "next/link";
import { FileText, AlertCircle } from "lucide-react";
import { useUserResume } from "@/hooks/useUserResume";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

interface ResumeSelectorProps {
	onResumeChange?: (resumeObjectPath: string | null) => void;
}

/**
 * Resume selector component (MVP).
 * Shows the user's most recent resume or a prompt to upload one.
 */
export function ResumeSelector({ onResumeChange }: ResumeSelectorProps) {
	const { resume, isLoading, error } = useUserResume();

	// Notify parent of resume availability
	if (onResumeChange) {
		onResumeChange(resume?.resumeObjectPath || null);
	}

	if (isLoading) {
		return (
			<div className="rounded-lg border border-border/50 bg-muted/20 p-4">
				<div className="flex items-center gap-3">
					<Skeleton className="h-10 w-10 rounded-lg" />
					<div className="space-y-2">
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
				<div className="flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
						<AlertCircle size={20} className="text-red-400" />
					</div>
					<div>
						<p className="font-medium text-red-400">
							Failed to load resume
						</p>
						<p className="text-sm text-red-400/80">{error}</p>
					</div>
				</div>
			</div>
		);
	}

	if (!resume) {
		return (
			<div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4">
				<div className="flex items-center justify-between gap-4">
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
							<FileText size={20} className="text-amber-400" />
						</div>
						<div>
							<p className="font-medium text-amber-400">
								No resume uploaded
							</p>
							<p className="text-sm text-amber-400/80">
								Upload a resume to generate tailored versions
							</p>
						</div>
					</div>
					<Link href="/dashboard/resumes">
						<Button variant="outline" size="sm">
							Upload resume
						</Button>
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="rounded-lg border border-border/50 bg-muted/20 p-4">
			<div className="flex items-center justify-between gap-4">
				<div className="flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
						<FileText size={20} className="text-emerald-400" />
					</div>
					<div>
						<p className="font-medium text-foreground">
							Resume to use
						</p>
						<p className="text-sm text-muted-foreground">
							{resume.resumeLabel ||
								resume.resumeFilename ||
								"Your resume"}
						</p>
					</div>
				</div>
				<Link href="/dashboard/resumes">
					<Button variant="ghost" size="sm">
						Change
					</Button>
				</Link>
			</div>
		</div>
	);
}
