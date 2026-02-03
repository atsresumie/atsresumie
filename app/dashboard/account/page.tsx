"use client";

import Link from "next/link";
import { CreditCard, Receipt, Sparkles, ArrowRight } from "lucide-react";
import { useCredits } from "@/hooks/useCredits";
import { Button } from "@/components/ui/button";

export default function AccountPage() {
	const { credits, isLoading: creditsLoading } = useCredits();

	return (
		<div className="p-6 md:p-8">
			<div className="max-w-2xl">
				{/* Header */}
				<h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
					Account Information
				</h1>
				<p className="mt-2 text-muted-foreground">
					View your plan, credits, and billing information.
				</p>

				<div className="mt-8 space-y-6">
					{/* Plan Section */}
					<div className="p-6 rounded-lg border border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
						<div className="flex items-center gap-2 mb-4">
							<Sparkles size={20} className="text-primary" />
							<h2 className="text-lg font-medium">
								Current Plan
							</h2>
						</div>
						<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
							<div>
								<span className="inline-flex items-center px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm font-semibold text-primary">
									Free Plan
								</span>
								<p className="mt-3 text-sm text-muted-foreground">
									You're on the free plan with limited
									credits.
								</p>
							</div>
							<Button
								size="lg"
								className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg shadow-primary/25 border-0"
								disabled
							>
								<Sparkles size={18} className="mr-2" />
								Upgrade Plan
								<ArrowRight size={18} className="ml-2" />
							</Button>
						</div>
						<p className="mt-4 text-xs text-muted-foreground italic">
							Upgrade options coming soon
						</p>
					</div>

					{/* Credits Section */}
					<div className="p-6 rounded-lg border border-border/50 bg-card/30">
						<div className="flex items-center gap-2 mb-4">
							<CreditCard
								size={20}
								className="text-muted-foreground"
							/>
							<h2 className="text-lg font-medium">Credits</h2>
						</div>
						<div className="flex items-baseline gap-2">
							<span className="text-3xl font-bold">
								{creditsLoading ? "…" : credits}
							</span>
							<span className="text-muted-foreground">
								credits remaining
							</span>
						</div>
						<div className="mt-4 p-4 rounded-lg bg-muted/30 border border-border/30">
							<h3 className="text-sm font-medium mb-2">
								How Credits Work
							</h3>
							<ul className="text-sm text-muted-foreground space-y-1">
								<li>• 1 credit = 1 resume generation</li>
								<li>• Downloads are always free</li>
								<li>• Credits never expire</li>
							</ul>
						</div>
						<div className="mt-4">
							<Button variant="outline" size="sm" asChild>
								<Link href="/dashboard/credits">
									View Credit Details
								</Link>
							</Button>
						</div>
					</div>

					{/* Invoices Section */}
					<div className="p-6 rounded-lg border border-border/50 bg-card/30">
						<div className="flex items-center gap-2 mb-4">
							<Receipt
								size={20}
								className="text-muted-foreground"
							/>
							<h2 className="text-lg font-medium">
								Invoices & Receipts
							</h2>
						</div>
						<div className="flex items-center justify-center py-8 text-center">
							<div>
								<p className="text-muted-foreground">
									Coming soon
								</p>
								<p className="text-sm text-muted-foreground mt-1">
									Purchase history and receipts will appear
									here
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
