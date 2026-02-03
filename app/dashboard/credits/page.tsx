"use client";

import { useState } from "react";
import Link from "next/link";
import {
	Coins,
	TrendingDown,
	AlertTriangle,
	RefreshCw,
	Sparkles,
	CreditCard,
	ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { useCredits } from "@/hooks/useCredits";
import { useCreditHistory, type CreditEvent } from "@/hooks/useCreditHistory";
import { cn } from "@/lib/utils";

/**
 * Event type display config
 */
const EVENT_CONFIG: Record<
	CreditEvent["event_type"],
	{ label: string; className: string }
> = {
	generation: {
		label: "Generation",
		className: "text-amber-400",
	},
	signup: {
		label: "Signup Bonus",
		className: "text-emerald-400",
	},
	refund: {
		label: "Refund",
		className: "text-blue-400",
	},
	bonus: {
		label: "Bonus",
		className: "text-purple-400",
	},
	purchase: {
		label: "Purchase",
		className: "text-emerald-400",
	},
};

/**
 * Format relative time
 */
function formatRelativeTime(dateString: string): string {
	const date = new Date(dateString);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffMins = Math.floor(diffMs / 60000);
	const diffHours = Math.floor(diffMins / 60);
	const diffDays = Math.floor(diffHours / 24);

	if (diffMins < 1) return "Just now";
	if (diffMins < 60) return `${diffMins}m ago`;
	if (diffHours < 24) return `${diffHours}h ago`;
	if (diffDays < 7) return `${diffDays}d ago`;
	return date.toLocaleDateString();
}

/**
 * Credits summary card
 */
function CreditsSummaryCard({
	credits,
	isLoading,
	error,
	onRetry,
}: {
	credits: number | null;
	isLoading: boolean;
	error: string | null;
	onRetry: () => void;
}) {
	const isLowCredits = credits !== null && credits <= 2;

	if (isLoading) {
		return (
			<div className="rounded-xl border border-border/50 bg-card/50 p-6">
				<div className="flex items-center gap-4">
					<Skeleton className="h-16 w-16 rounded-full" />
					<div className="space-y-2">
						<Skeleton className="h-10 w-24" />
						<Skeleton className="h-4 w-40" />
					</div>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6">
				<div className="flex items-center justify-between gap-4">
					<div className="flex items-center gap-4">
						<div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
							<AlertTriangle size={32} className="text-red-400" />
						</div>
						<div>
							<p className="font-semibold text-red-400">
								Failed to load credits
							</p>
							<p className="text-sm text-red-400/80">{error}</p>
						</div>
					</div>
					<Button variant="outline" size="sm" onClick={onRetry}>
						<RefreshCw size={16} className="mr-2" />
						Retry
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div
			className={cn(
				"rounded-xl border p-6",
				isLowCredits
					? "border-amber-500/30 bg-amber-500/5"
					: "border-border/50 bg-card/50",
			)}
		>
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div className="flex items-center gap-4">
					<div
						className={cn(
							"flex h-16 w-16 items-center justify-center rounded-full",
							isLowCredits ? "bg-amber-500/10" : "bg-primary/10",
						)}
					>
						<Coins
							size={32}
							className={
								isLowCredits ? "text-amber-400" : "text-primary"
							}
						/>
					</div>
					<div>
						<p
							className={cn(
								"text-4xl font-bold",
								isLowCredits
									? "text-amber-400"
									: "text-foreground",
							)}
						>
							{credits ?? 0}
						</p>
						<p className="text-sm text-muted-foreground">
							credits remaining
						</p>
					</div>
				</div>

				<div className="flex flex-col gap-2 sm:items-end">
					<span className="rounded-full bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
						Plan: Free
					</span>
					{isLowCredits && (
						<span className="flex items-center gap-1 text-sm text-amber-400">
							<AlertTriangle size={14} />
							Low credits
						</span>
					)}
				</div>
			</div>

			<p className="mt-4 text-sm text-muted-foreground">
				Generations cost 1 credit each. PDF export is free.
			</p>
		</div>
	);
}

/**
 * Usage this month card
 */
function UsageCard({
	usageThisMonth,
	isLoading,
}: {
	usageThisMonth: number;
	isLoading: boolean;
}) {
	return (
		<div className="rounded-xl border border-border/50 bg-card/50 p-6">
			<div className="flex items-center gap-3">
				<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
					<TrendingDown size={20} className="text-blue-400" />
				</div>
				<div>
					<p className="text-sm text-muted-foreground">
						Credits used this month
					</p>
					{isLoading ? (
						<Skeleton className="mt-1 h-7 w-12" />
					) : (
						<p className="text-2xl font-semibold text-foreground">
							{usageThisMonth}
						</p>
					)}
				</div>
			</div>
		</div>
	);
}

/**
 * Credit event row
 */
function CreditEventRow({ event }: { event: CreditEvent }) {
	const config = EVENT_CONFIG[event.event_type] || EVENT_CONFIG.generation;

	return (
		<div className="flex items-center justify-between gap-4 rounded-lg border border-border/30 bg-muted/20 p-3">
			<div className="min-w-0 flex-1">
				<div className="flex items-center gap-2">
					<span
						className={cn("text-sm font-medium", config.className)}
					>
						{config.label}
					</span>
					{event.job_label && (
						<span className="truncate text-sm text-muted-foreground">
							— {event.job_label}
						</span>
					)}
				</div>
				<p className="text-xs text-muted-foreground">
					{formatRelativeTime(event.created_at)}
				</p>
			</div>
			<span
				className={cn(
					"text-sm font-semibold",
					event.amount < 0 ? "text-red-400" : "text-emerald-400",
				)}
			>
				{event.amount > 0 ? "+" : ""}
				{event.amount}
			</span>
		</div>
	);
}

/**
 * Credit history card
 */
function CreditHistoryCard({
	events,
	isLoading,
	error,
}: {
	events: CreditEvent[];
	isLoading: boolean;
	error: string | null;
}) {
	if (isLoading) {
		return (
			<div className="rounded-xl border border-border/50 bg-card/50 p-6">
				<h3 className="mb-4 font-semibold text-foreground">
					Recent Activity
				</h3>
				<div className="space-y-2">
					{[1, 2, 3].map((i) => (
						<div
							key={i}
							className="flex items-center justify-between rounded-lg border border-border/30 bg-muted/20 p-3"
						>
							<div className="space-y-1">
								<Skeleton className="h-4 w-32" />
								<Skeleton className="h-3 w-20" />
							</div>
							<Skeleton className="h-4 w-8" />
						</div>
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="rounded-xl border border-border/50 bg-card/50 p-6">
			<h3 className="mb-4 font-semibold text-foreground">
				Recent Activity
			</h3>

			{error ? (
				<p className="text-sm text-red-400">{error}</p>
			) : events.length === 0 ? (
				<div className="py-8 text-center">
					<p className="text-muted-foreground">
						No credit activity yet.
					</p>
					<Link href="/dashboard/generate">
						<Button variant="outline" size="sm" className="mt-4">
							<Sparkles size={16} className="mr-2" />
							Generate your first resume
						</Button>
					</Link>
				</div>
			) : (
				<div className="space-y-2">
					{events.map((event) => (
						<CreditEventRow key={event.id} event={event} />
					))}
				</div>
			)}
		</div>
	);
}

/**
 * Buy credits placeholder dialog
 */
function BuyCreditsDialog() {
	const [open, setOpen] = useState(false);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button className="gap-2">
					<CreditCard size={16} />
					Buy Credits
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Buy Credits</DialogTitle>
					<DialogDescription>
						Credit purchasing is coming soon!
					</DialogDescription>
				</DialogHeader>
				<div className="py-6 text-center">
					<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
						<CreditCard size={32} className="text-primary" />
					</div>
					<p className="text-muted-foreground">
						We&apos;re working on integrating secure payment
						processing. Check back soon!
					</p>
				</div>
				<div className="flex justify-center">
					<Button variant="outline" onClick={() => setOpen(false)}>
						Got it
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}

/**
 * Main Credits & Billing page
 */
export default function CreditsPage() {
	const {
		credits,
		isLoading: creditsLoading,
		error: creditsError,
		refetch: refetchCredits,
	} = useCredits();
	const {
		events,
		isLoading: historyLoading,
		error: historyError,
		usageThisMonth,
	} = useCreditHistory();

	return (
		<div className="p-6 md:p-8">
			{/* Header */}
			<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
						Credits & Billing
					</h1>
					<p className="mt-2 text-muted-foreground">
						Credits are used when you generate a tailored resume.
						Export/download is free.
					</p>
				</div>
				<BuyCreditsDialog />
			</div>

			{/* Grid layout */}
			<div className="grid gap-6 lg:grid-cols-3">
				{/* Left column */}
				<div className="space-y-6 lg:col-span-2">
					{/* Credits summary */}
					<CreditsSummaryCard
						credits={credits}
						isLoading={creditsLoading}
						error={creditsError}
						onRetry={refetchCredits}
					/>

					{/* Credit history */}
					<CreditHistoryCard
						events={events}
						isLoading={historyLoading}
						error={historyError}
					/>
				</div>

				{/* Right column */}
				<div className="space-y-6">
					{/* Usage this month */}
					<UsageCard
						usageThisMonth={usageThisMonth}
						isLoading={historyLoading}
					/>

					{/* What costs credits */}
					<div className="rounded-xl border border-border/50 bg-card/50 p-6">
						<h3 className="mb-4 font-semibold text-foreground">
							What costs credits?
						</h3>
						<ul className="space-y-3 text-sm">
							<li className="flex items-center justify-between">
								<span className="text-muted-foreground">
									Resume generation
								</span>
								<span className="font-medium text-foreground">
									1 credit
								</span>
							</li>
							<li className="flex items-center justify-between">
								<span className="text-muted-foreground">
									PDF export
								</span>
								<span className="font-medium text-emerald-400">
									Free
								</span>
							</li>
							<li className="flex items-center justify-between">
								<span className="text-muted-foreground">
									Re-download
								</span>
								<span className="font-medium text-emerald-400">
									Free
								</span>
							</li>
						</ul>
					</div>

					{/* Need more credits? */}
					<div className="rounded-xl border border-primary/20 bg-primary/5 p-6">
						<h3 className="mb-2 font-semibold text-foreground">
							Need more credits?
						</h3>
						<p className="mb-4 text-sm text-muted-foreground">
							Credit purchasing will be available soon. Stay
							tuned!
						</p>
						<Button
							variant="outline"
							size="sm"
							disabled
							className="gap-2"
						>
							<ExternalLink size={14} />
							View pricing (coming soon)
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
