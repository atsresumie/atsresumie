"use client";

import { useEffect } from "react";
import Link from "next/link";
import { CreditCard, AlertTriangle, Loader2 } from "lucide-react";
import { useCredits } from "@/hooks/useCredits";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const LOW_CREDITS_THRESHOLD = 2;

/**
 * Credits summary card for dashboard home.
 * Shows current credits, low credits warning, and link to credits page.
 * Refetches on window focus as MVP before full realtime.
 */
export function CreditsCard() {
	const { credits, isLoading, error, refetch } = useCredits();

	// Refetch on window focus to ensure credits are fresh
	useEffect(() => {
		const handleVisibilityChange = () => {
			if (document.visibilityState === "visible") {
				refetch();
			}
		};

		document.addEventListener("visibilitychange", handleVisibilityChange);
		return () => {
			document.removeEventListener(
				"visibilitychange",
				handleVisibilityChange,
			);
		};
	}, [refetch]);

	const isLowCredits = credits !== null && credits <= LOW_CREDITS_THRESHOLD;
	const isOutOfCredits = credits === 0;

	return (
		<div className="rounded-xl border border-border/50 bg-card/50 p-6">
			{/* Header */}
			<div className="mb-4 flex items-center gap-2">
				<CreditCard size={20} className="text-muted-foreground" />
				<h2 className="text-lg font-semibold text-foreground">
					Credits
				</h2>
			</div>

			{/* Content */}
			{isLoading ? (
				<div className="space-y-3">
					<Skeleton className="h-10 w-24" />
					<Skeleton className="h-4 w-48" />
				</div>
			) : error ? (
				<div className="text-sm text-muted-foreground">
					<p>Unable to load credits</p>
					<Button
						variant="ghost"
						size="sm"
						onClick={refetch}
						className="mt-2 h-8 px-2"
					>
						Retry
					</Button>
				</div>
			) : (
				<>
					{/* Credits count */}
					<div className="mb-2">
						<span
							className={cn(
								"text-3xl font-bold tabular-nums",
								isOutOfCredits
									? "text-red-400"
									: isLowCredits
										? "text-amber-400"
										: "text-foreground",
							)}
						>
							{credits ?? "—"}
						</span>
						<span className="ml-2 text-muted-foreground">
							credit{credits !== 1 ? "s" : ""} remaining
						</span>
					</div>

					{/* Low credits warning */}
					{isLowCredits && (
						<div
							className={cn(
								"mb-3 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
								isOutOfCredits
									? "border-red-500/20 bg-red-500/10 text-red-400"
									: "border-amber-500/20 bg-amber-500/10 text-amber-400",
							)}
						>
							<AlertTriangle size={16} />
							<span>
								{isOutOfCredits
									? "Out of credits. Purchase more to continue generating."
									: "Low credits. Consider purchasing more."}
							</span>
						</div>
					)}

					{/* Helper text */}
					<p className="mb-4 text-sm text-muted-foreground">
						Credits apply to generation only.
					</p>

					{/* CTA */}
					<Link href="/dashboard/credits">
						<Button variant="outline" size="sm" className="w-full">
							View credits
						</Button>
					</Link>
				</>
			)}
		</div>
	);
}
