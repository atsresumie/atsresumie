"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
	Download,
	Copy,
	Loader2,
	ChevronDown,
	ChevronUp,
	AlertCircle,
	Pencil,
} from "lucide-react";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
	type GenerationJobFull,
	type GenerationJobStatus,
	STATUS_LABELS,
	deriveJobLabel,
	getRelativeTime,
} from "@/hooks/useGenerations";
import { cn } from "@/lib/utils";

interface GenerationDetailsDrawerProps {
	job: GenerationJobFull | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

/**
 * Inline status badge for drawer
 */
function StatusBadge({ status }: { status: GenerationJobStatus }) {
	const config: Record<GenerationJobStatus, { className: string }> = {
		queued: {
			className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
		},
		processing: {
			className: "bg-blue-500/10 text-blue-400 border-blue-500/20",
		},
		succeeded: {
			className:
				"bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
		},
		failed: {
			className: "bg-red-500/10 text-red-400 border-red-500/20",
		},
	};

	const { className } = config[status] || config.queued;
	const label = STATUS_LABELS[status] || status;

	return (
		<span
			className={cn(
				"inline-flex items-center rounded-full border px-2.5 py-1 text-sm font-medium",
				className,
			)}
		>
			{label}
		</span>
	);
}

/**
 * Timestamp display component
 */
function Timestamp({ label, value }: { label: string; value: string | null }) {
	if (!value) return null;

	return (
		<div className="flex justify-between text-sm">
			<span className="text-muted-foreground">{label}</span>
			<span className="text-foreground">{getRelativeTime(value)}</span>
		</div>
	);
}

export function GenerationDetailsDrawer({
	job,
	open,
	onOpenChange,
}: GenerationDetailsDrawerProps) {
	const router = useRouter();
	const [isDownloading, setIsDownloading] = useState(false);
	const [downloadError, setDownloadError] = useState<string | null>(null);
	const [isJdExpanded, setIsJdExpanded] = useState(false);

	if (!job) return null;

	const label = deriveJobLabel(job.jd_text);
	const hasPdf = job.status === "succeeded" && !!job.pdf_object_path;
	const isPdfPreparing =
		job.status === "succeeded" &&
		!job.pdf_object_path &&
		job.pdf_status !== "failed";
	const isPdfFailed =
		job.status === "succeeded" &&
		job.pdf_status === "failed" &&
		!job.pdf_object_path;
	const hasLongJd = job.jd_text && job.jd_text.length > 300;

	const handleDownload = async () => {
		if (job.status !== "succeeded") return;

		setIsDownloading(true);
		setDownloadError(null);

		try {
			const res = await fetch("/api/export-pdf", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ jobId: job.id }),
			});

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || "Failed to download PDF");
			}

			const { pdfUrl } = await res.json();
			window.open(pdfUrl, "_blank");
		} catch (err) {
			console.error("Download error:", err);
			setDownloadError(
				err instanceof Error ? err.message : "Download failed",
			);
		} finally {
			setIsDownloading(false);
		}
	};

	const handleDuplicate = () => {
		// Navigate to generate page with job ID to load JD from DB
		router.push(`/dashboard/generate?fromJobId=${job.id}`);
		onOpenChange(false);
	};

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="w-full overflow-y-auto sm:max-w-md">
				<SheetHeader className="space-y-3">
					<SheetTitle className="text-lg">{label}</SheetTitle>
					<SheetDescription className="sr-only">
						Job details and actions
					</SheetDescription>
				</SheetHeader>

				<div className="mt-6 space-y-6">
					{/* Status */}
					<div className="space-y-3">
						<h3 className="text-sm font-medium text-muted-foreground">
							Status
						</h3>
						<StatusBadge status={job.status} />
					</div>

					{/* Timestamps */}
					<div className="space-y-2 rounded-lg border border-border/50 bg-muted/20 p-3">
						<Timestamp label="Created" value={job.created_at} />
						<Timestamp label="Started" value={job.started_at} />
						<Timestamp label="Completed" value={job.completed_at} />
					</div>

					{/* Error message (if failed) */}
					{job.status === "failed" && job.error_message && (
						<div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3">
							<div className="flex items-start gap-2">
								<AlertCircle
									size={16}
									className="mt-0.5 flex-shrink-0 text-red-400"
								/>
								<div>
									<p className="text-sm font-medium text-red-400">
										Error
									</p>
									<p className="mt-1 text-sm text-red-400/80">
										{job.error_message}
									</p>
								</div>
							</div>
						</div>
					)}

					{/* JD Preview */}
					{job.jd_text && (
						<div className="space-y-2">
							<h3 className="text-sm font-medium text-muted-foreground">
								Job Description
							</h3>
							<div className="rounded-lg border border-border/50 bg-muted/20 p-3">
								<p
									className={cn(
										"whitespace-pre-wrap text-sm text-foreground",
										!isJdExpanded &&
											hasLongJd &&
											"line-clamp-6",
									)}
								>
									{job.jd_text}
								</p>
								{hasLongJd && (
									<Button
										variant="ghost"
										size="sm"
										className="mt-2 h-7 px-2 text-xs"
										onClick={() =>
											setIsJdExpanded(!isJdExpanded)
										}
									>
										{isJdExpanded ? (
											<>
												<ChevronUp
													size={14}
													className="mr-1"
												/>
												Show less
											</>
										) : (
											<>
												<ChevronDown
													size={14}
													className="mr-1"
												/>
												Show more
											</>
										)}
									</Button>
								)}
							</div>
						</div>
					)}

					{/* Actions */}
					<div className="space-y-2 pt-4">
						{job.status === "succeeded" && (
							<Link href={`/dashboard/editor/${job.id}`}>
								<Button
									variant="outline"
									className="w-full"
									onClick={() => onOpenChange(false)}
								>
									<Pencil size={16} className="mr-2" />
									Edit & Download
								</Button>
							</Link>
						)}

						<Button
							className="w-full"
							disabled={
								job.status !== "succeeded" || isDownloading
							}
							onClick={handleDownload}
						>
							{isDownloading || isPdfPreparing ? (
								<Loader2
									size={16}
									className="mr-2 animate-spin"
								/>
							) : (
								<Download size={16} className="mr-2" />
							)}
							{isPdfPreparing
								? "PDF Preparing…"
								: isPdfFailed
									? "Retry PDF Download"
									: "Download PDF"}
						</Button>
						{downloadError && (
							<p className="text-center text-xs text-red-400">
								{downloadError}
							</p>
						)}

						<Button
							variant="outline"
							className="w-full"
							onClick={handleDuplicate}
						>
							<Copy size={16} className="mr-2" />
							Duplicate
						</Button>
					</div>
				</div>
			</SheetContent>
		</Sheet>
	);
}
