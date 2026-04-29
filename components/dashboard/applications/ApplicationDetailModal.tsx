"use client";

import { useState, useEffect } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
	type JobApplication,
	STAGE_LABELS,
} from "@/hooks/useJobApplications";
import {
	ExternalLink,
	MapPin,
	DollarSign,
	Calendar,
	Briefcase,
	StickyNote,
	Pencil,
	Loader2,
	Globe,
	Building2,
	Clock,
	AlertCircle,
} from "lucide-react";

interface ScrapedJob {
	title: string | null;
	company: string | null;
	location: string | null;
	salary: string | null;
	employmentType: string | null;
	description: string | null;
	source: string | null;
	fetchFailed?: boolean;
}

interface ApplicationDetailModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	application: JobApplication | null;
	onEdit: (app: JobApplication) => void;
}

function formatDate(dateStr: string | null): string {
	if (!dateStr) return "—";
	return new Date(dateStr).toLocaleDateString("en-US", {
		month: "long",
		day: "numeric",
		year: "numeric",
	});
}

export function ApplicationDetailModal({
	open,
	onOpenChange,
	application,
	onEdit,
}: ApplicationDetailModalProps) {
	const [scraped, setScraped] = useState<ScrapedJob | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [scrapeError, setScrapeError] = useState<string | null>(null);

	// Scrape job posting when modal opens with a URL
	useEffect(() => {
		if (!open || !application?.source_url) {
			setScraped(null);
			setScrapeError(null);
			return;
		}

		let cancelled = false;

		async function fetchJobPosting() {
			setIsLoading(true);
			setScrapeError(null);
			try {
				const res = await fetch("/api/jobs/scrape", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ url: application!.source_url }),
				});

				if (!res.ok) {
					const data = await res.json();
					throw new Error(data.error || "Failed to fetch posting");
				}

				const data = await res.json();
				if (!cancelled) {
					setScraped(data);
				}
			} catch (err) {
				if (!cancelled) {
					setScrapeError(
						err instanceof Error
							? err.message
							: "Could not load job posting",
					);
				}
			} finally {
				if (!cancelled) {
					setIsLoading(false);
				}
			}
		}

		fetchJobPosting();

		return () => {
			cancelled = true;
		};
	}, [open, application?.source_url]);

	if (!application) return null;

	const initials = application.company
		.split(" ")
		.map((w) => w[0])
		.join("")
		.slice(0, 2)
		.toUpperCase();

	const stageBadgeColors: Record<string, string> = {
		saved: "bg-muted text-muted-foreground",
		applied:
			"bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
		interview:
			"bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
		offer: "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400",
		rejected:
			"bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
	};

	const hasPosting = !!application.source_url;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-2xl max-h-[85vh] p-0 overflow-hidden flex flex-col">
				{/* Header */}
				<div className="px-6 pt-6 pb-4 border-b border-border/40 flex-shrink-0">
					<div className="flex items-start gap-4">
						<div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
							{initials}
						</div>
						<div className="flex-1 min-w-0">
							<DialogHeader className="space-y-0 text-left">
								<DialogTitle className="text-lg font-semibold text-foreground">
									{scraped?.title || application.role}
								</DialogTitle>
							</DialogHeader>
							<div className="flex items-center gap-2 mt-1 flex-wrap">
								<span className="text-sm text-muted-foreground">
									{scraped?.company || application.company}
								</span>
								<span
									className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full ${stageBadgeColors[application.stage] || "bg-muted text-muted-foreground"}`}
								>
									{STAGE_LABELS[application.stage]}
								</span>
								{scraped?.source && (
									<span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
										<Globe size={9} />
										{scraped.source}
									</span>
								)}
							</div>
						</div>
					</div>

					{/* Quick info pills */}
					<div className="flex flex-wrap gap-2 mt-3">
						{(scraped?.location || application.location) && (
							<span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md bg-muted/50 text-muted-foreground">
								<MapPin size={11} />
								{scraped?.location || application.location}
							</span>
						)}
						{(scraped?.salary || application.salary) && (
							<span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 font-medium">
								<DollarSign size={11} />
								{scraped?.salary || application.salary}
							</span>
						)}
						{scraped?.employmentType && (
							<span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
								<Clock size={11} />
								{scraped.employmentType}
							</span>
						)}
						{application.interview_date && (
							<span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400">
								<Calendar size={11} />
								Interview{" "}
								{formatDate(application.interview_date)}
							</span>
						)}
					</div>
				</div>

				{/* Body — scrollable */}
				<div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
					{/* Loading state */}
					{isLoading && (
						<div className="flex flex-col items-center justify-center py-12 gap-3">
							<Loader2
								size={24}
								className="animate-spin text-primary"
							/>
							<p className="text-sm text-muted-foreground">
								Fetching job posting...
							</p>
						</div>
					)}

					{/* Scraped job description — full content available */}
					{scraped?.description && !isLoading && !scraped.fetchFailed && (
						<div>
							<div className="flex items-center gap-2 mb-3">
								<Building2
									size={14}
									className="text-muted-foreground"
								/>
								<h3 className="text-sm font-semibold text-foreground">
									Job Description
								</h3>
							</div>
							<div className="text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap bg-muted/20 rounded-lg p-4 border border-border/30 max-h-[300px] overflow-y-auto">
								{scraped.description}
							</div>
						</div>
					)}

					{/* Fetch failed — show embedded link card instead of error text */}
					{(scrapeError || scraped?.fetchFailed) && !isLoading && hasPosting && (
						<div className="rounded-xl border border-border/50 bg-muted/20 overflow-hidden">
							<div className="px-4 py-3 border-b border-border/30 flex items-center gap-2">
								{/* Favicon */}
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img
									src={`https://www.google.com/s2/favicons?sz=32&domain=${scraped?.source || new URL(application.source_url!).hostname}`}
									alt=""
									className="w-4 h-4 rounded-sm"
								/>
								<span className="text-xs font-medium text-foreground">
									{scraped?.source || new URL(application.source_url!).hostname.replace("www.", "")}
								</span>
							</div>
							<div className="px-4 py-5 text-center space-y-3">
								<div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
									<ExternalLink size={18} className="text-primary" />
								</div>
								<div>
									<p className="text-sm font-medium text-foreground">
										View the full job posting
									</p>
									<p className="text-xs text-muted-foreground mt-1">
										This posting is hosted on {scraped?.source || "an external site"} and requires a browser to view.
									</p>
								</div>
								<a
									href={application.source_url!}
									target="_blank"
									rel="noopener noreferrer"
									className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
								>
									Open on {scraped?.source || "site"}
									<ExternalLink size={13} />
								</a>
							</div>
						</div>
					)}

					{/* No URL — prompt to add one */}
					{!hasPosting && !isLoading && (
						<div className="text-center py-8">
							<Globe
								size={32}
								className="mx-auto text-muted-foreground/30 mb-3"
							/>
							<p className="text-sm text-muted-foreground">
								No job posting URL attached
							</p>
							<p className="text-xs text-muted-foreground/60 mt-1">
								Add a posting URL to see the full job details here
							</p>
						</div>
					)}

					{/* Application info */}
					<div className="space-y-2.5 pt-2 border-t border-border/30">
						<h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
							Your Application
						</h3>

						<div className="flex items-center gap-3 text-sm">
							<Briefcase
								size={14}
								className="text-muted-foreground flex-shrink-0"
							/>
							<span className="text-foreground">
								Added {formatDate(application.created_at)}
							</span>
						</div>

						{application.applied_at && (
							<div className="flex items-center gap-3 text-sm">
								<Calendar
									size={14}
									className="text-blue-500 flex-shrink-0"
								/>
								<span className="text-foreground">
									Applied{" "}
									{formatDate(application.applied_at)}
								</span>
							</div>
						)}

						{/* Notes */}
						{application.notes && (
							<div className="mt-2">
								<div className="flex items-center gap-2 mb-1.5">
									<StickyNote
										size={12}
										className="text-muted-foreground"
									/>
									<span className="text-xs font-medium text-muted-foreground">
										Notes
									</span>
								</div>
								<p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap bg-muted/30 rounded-md p-3">
									{application.notes}
								</p>
							</div>
						)}
					</div>
				</div>

				{/* Action footer */}
				<div className="px-6 py-4 border-t border-border/40 bg-muted/20 flex items-center gap-3 flex-shrink-0">
					{hasPosting ? (
						<Button asChild className="flex-1 gap-2">
							<a
								href={application.source_url!}
								target="_blank"
								rel="noopener noreferrer"
							>
								{application.stage === "saved"
									? "Apply Now"
									: "View Posting"}
								<ExternalLink size={14} />
							</a>
						</Button>
					) : (
						<Button
							variant="outline"
							className="flex-1 gap-2"
							onClick={() => {
								onOpenChange(false);
								onEdit(application);
							}}
						>
							Add Posting URL
						</Button>
					)}
					<Button
						variant="outline"
						className="gap-2"
						onClick={() => {
							onOpenChange(false);
							onEdit(application);
						}}
					>
						<Pencil size={14} />
						Edit
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
