"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
	Coins,
	TrendingDown,
	AlertTriangle,
	RefreshCw,
	Sparkles,
	CreditCard,
	Loader2,
	CheckCircle2,
	XCircle,
	Clock,
	ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCredits } from "@/hooks/useCredits";
import { useCreditHistory, type CreditEvent } from "@/hooks/useCreditHistory";
import {
	usePurchaseHistory,
	type CreditPurchase,
	PACK_LABELS,
	formatPrice,
} from "@/hooks/usePurchaseHistory";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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
 * Purchase status badge
 */
function PurchaseStatusBadge({ status }: { status: CreditPurchase["status"] }) {
	const config = {
		pending: { icon: Clock, className: "text-yellow-400 bg-yellow-400/10" },
		succeeded: {
			icon: CheckCircle2,
			className: "text-emerald-400 bg-emerald-400/10",
		},
		failed: { icon: XCircle, className: "text-red-400 bg-red-400/10" },
		refunded: {
			icon: RefreshCw,
			className: "text-blue-400 bg-blue-400/10",
		},
	};
	const { icon: Icon, className } = config[status];

	return (
		<span
			className={cn(
				"flex items-center gap-1 rounded-full px-2 py-0.5 text-xs",
				className,
			)}
		>
			<Icon size={12} />
			{status.charAt(0).toUpperCase() + status.slice(1)}
		</span>
	);
}

/**
 * Purchase history card
 */
function PurchaseHistoryCard({
	purchases,
	isLoading,
}: {
	purchases: CreditPurchase[];
	isLoading: boolean;
}) {
	if (isLoading) {
		return (
			<div className="rounded-xl border border-border/50 bg-card/50 p-6">
				<h3 className="mb-4 font-semibold text-foreground">
					Purchase History
				</h3>
				<div className="space-y-2">
					{[1, 2].map((i) => (
						<div
							key={i}
							className="flex items-center justify-between rounded-lg border border-border/30 bg-muted/20 p-3"
						>
							<div className="space-y-1">
								<Skeleton className="h-4 w-24" />
								<Skeleton className="h-3 w-16" />
							</div>
							<Skeleton className="h-5 w-20" />
						</div>
					))}
				</div>
			</div>
		);
	}

	if (purchases.length === 0) {
		return null; // Don't show empty purchase history
	}

	return (
		<div className="rounded-xl border border-border/50 bg-card/50 p-6">
			<h3 className="mb-4 font-semibold text-foreground">
				Purchase History
			</h3>
			<div className="space-y-2">
				{purchases.map((purchase) => (
					<div
						key={purchase.id}
						className="flex items-center justify-between gap-4 rounded-lg border border-border/30 bg-muted/20 p-3"
					>
						<div className="min-w-0 flex-1">
							<div className="flex items-center gap-2">
								<span className="text-sm font-medium text-foreground">
									{PACK_LABELS[purchase.pack_id] ||
										purchase.pack_id}
								</span>
								<span className="text-sm text-emerald-400">
									+{purchase.credits_amount} credits
								</span>
							</div>
							<p className="text-xs text-muted-foreground">
								{formatRelativeTime(purchase.created_at)} •{" "}
								{formatPrice(
									purchase.amount_paid_cents,
									purchase.currency,
								)}
							</p>
						</div>
						<PurchaseStatusBadge status={purchase.status} />
					</div>
				))}
			</div>
		</div>
	);
}

/**
 * Credit pack card with buy button
 */
function CreditPackCard({
	packId,
	label,
	credits,
	priceCents,
	currency,
	onBuy,
	isLoading,
}: {
	packId: string;
	label: string;
	credits: number;
	priceCents: number;
	currency: string;
	onBuy: (packId: string) => void;
	isLoading: boolean;
}) {
	const price = (priceCents / 100).toFixed(0);

	return (
		<div className="group relative rounded-2xl border border-border/60 bg-card p-6 transition-all hover:border-border hover:shadow-xl">
			{/* Header with price */}
			<div className="mb-6 flex items-start justify-between">
				<div>
					<h3 className="text-lg font-semibold text-foreground">
						{label}
					</h3>
					<p className="text-sm text-muted-foreground">
						Monthly subscription
					</p>
				</div>
				<div className="text-right">
					<div className="flex items-baseline gap-0.5">
						<span className="text-3xl font-bold text-foreground">
							${price}
						</span>
						<span className="text-sm text-muted-foreground">
							/{currency.toUpperCase()}
						</span>
					</div>
					<p className="text-xs text-muted-foreground">per month</p>
				</div>
			</div>

			{/* Credits highlight */}
			<div className="mb-6 flex items-center gap-3 rounded-xl bg-amber-500/10 px-4 py-3">
				<Coins size={20} className="text-amber-500" />
				<span className="font-semibold text-foreground">
					{credits} credits
				</span>
				<span className="text-sm text-muted-foreground">
					every month
				</span>
			</div>

			{/* Features - compact */}
			<ul className="mb-6 space-y-2 text-sm">
				<li className="flex items-center gap-2 text-muted-foreground">
					<CheckCircle2 size={14} className="text-emerald-500" />
					Unlimited PDF exports
				</li>
				<li className="flex items-center gap-2 text-muted-foreground">
					<CheckCircle2 size={14} className="text-emerald-500" />
					Cancel anytime
				</li>
			</ul>

			{/* CTA */}
			<Button
				className="w-full"
				onClick={() => onBuy(packId)}
				disabled={isLoading}
			>
				{isLoading ? (
					<>
						<Loader2 size={16} className="mr-2 animate-spin" />
						Processing...
					</>
				) : (
					"Subscribe"
				)}
			</Button>
		</div>
	);
}

/**
 * Credits page content (uses useSearchParams, requires Suspense)
 */
function CreditsPageContent() {
	const searchParams = useSearchParams();
	const router = useRouter();

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
	const {
		purchases,
		isLoading: purchasesLoading,
		refetch: refetchPurchases,
	} = usePurchaseHistory();

	const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
	const [purchaseStatus, setPurchaseStatus] = useState<
		"success" | "cancel" | null
	>(null);

	// Handle purchase return status
	useEffect(() => {
		const purchase = searchParams.get("purchase");

		if (purchase === "success") {
			setPurchaseStatus("success");
			toast.success("Payment received! Credits will appear shortly.");

			// Poll for credits update (max 10 seconds, every 2 seconds)
			let attempts = 0;
			const maxAttempts = 5;
			const initialCredits = credits;

			const pollInterval = setInterval(async () => {
				attempts++;
				await refetchCredits();
				await refetchPurchases();

				if (attempts >= maxAttempts) {
					clearInterval(pollInterval);
					// Check if credits updated
					if (credits === initialCredits) {
						toast.info(
							"Credits may take a moment to appear. If not visible after refresh, please contact support.",
							{ duration: 8000 },
						);
					}
				}
			}, 2000);

			// Clear URL params after handling
			setTimeout(() => {
				router.replace("/dashboard/credits", { scroll: false });
			}, 500);

			return () => clearInterval(pollInterval);
		} else if (purchase === "cancel") {
			setPurchaseStatus("cancel");
			toast.error("Purchase canceled");

			// Clear URL params
			setTimeout(() => {
				router.replace("/dashboard/credits", { scroll: false });
			}, 500);
		}
	}, [searchParams, router, refetchCredits, refetchPurchases, credits]);

	// Handle buy credits
	const handleBuyCredits = useCallback(
		async (packId: string) => {
			if (isCheckoutLoading) return;

			setIsCheckoutLoading(true);
			try {
				const res = await fetch("/api/stripe/checkout", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ packId }),
				});

				const data = await res.json();

				if (!res.ok) {
					throw new Error(
						data.error || "Failed to create checkout session",
					);
				}

				if (!data.url) {
					throw new Error("No checkout URL returned");
				}

				// Redirect to Stripe Checkout
				window.location.href = data.url;
			} catch (error) {
				console.error("Checkout error:", error);
				toast.error(
					error instanceof Error
						? error.message
						: "Failed to start checkout",
				);
				setIsCheckoutLoading(false);
			}
		},
		[isCheckoutLoading],
	);

	return (
		<div className="p-6 md:p-8">
			{/* Success banner */}
			{purchaseStatus === "success" && (
				<div className="mb-6 flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
					<CheckCircle2 className="h-5 w-5 text-emerald-400" />
					<div>
						<p className="font-medium text-emerald-400">
							Payment successful!
						</p>
						<p className="text-sm text-emerald-400/80">
							Your credits will appear in a few seconds.
						</p>
					</div>
				</div>
			)}

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

					{/* Purchase history */}
					<PurchaseHistoryCard
						purchases={purchases}
						isLoading={purchasesLoading}
					/>
				</div>

				{/* Right column */}
				<div className="space-y-6">
					{/* Credit pack */}
					<CreditPackCard
						packId="pro_75"
						label="Pro Pack"
						credits={75}
						priceCents={1000}
						currency="cad"
						onBuy={handleBuyCredits}
						isLoading={isCheckoutLoading}
					/>

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
				</div>
			</div>
		</div>
	);
}

/**
 * Credits page loading fallback
 */
function CreditsPageLoading() {
	return (
		<div className="p-6 md:p-8">
			<div className="mb-6">
				<Skeleton className="h-9 w-64" />
				<Skeleton className="mt-2 h-5 w-96" />
			</div>
			<div className="grid gap-6 lg:grid-cols-3">
				<div className="space-y-6 lg:col-span-2">
					<Skeleton className="h-40 w-full rounded-xl" />
					<Skeleton className="h-60 w-full rounded-xl" />
				</div>
				<div className="space-y-6">
					<Skeleton className="h-64 w-full rounded-xl" />
					<Skeleton className="h-24 w-full rounded-xl" />
				</div>
			</div>
		</div>
	);
}

/**
 * Main Credits & Billing page (default export wrapped in Suspense)
 */
export default function CreditsPage() {
	return (
		<Suspense fallback={<CreditsPageLoading />}>
			<CreditsPageContent />
		</Suspense>
	);
}
