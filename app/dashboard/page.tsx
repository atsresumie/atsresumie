"use client";

import { QuickActionsGrid } from "@/components/dashboard/QuickActionsGrid";
import { RecentGenerationsCard } from "@/components/dashboard/RecentGenerationsCard";
import { CreditsCard } from "@/components/dashboard/CreditsCard";

export default function DashboardHomePage() {
	return (
		<div className="p-6 md:p-8">
			{/* Page Header */}
			<div className="mb-8">
				<h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
					Dashboard
				</h1>
				<p className="mt-2 text-muted-foreground">
					Manage your generations, saved job descriptions, resumes,
					and downloads.
				</p>
			</div>

			{/* Quick Actions */}
			<section className="mb-8">
				<h2 className="mb-4 text-lg font-semibold text-foreground">
					Quick Actions
				</h2>
				<QuickActionsGrid />
			</section>

			{/* Main Content Grid */}
			<div className="grid gap-6 lg:grid-cols-3">
				{/* Recent Generations - takes 2 columns on large screens */}
				<div className="lg:col-span-2">
					<RecentGenerationsCard />
				</div>

				{/* Credits Card - takes 1 column */}
				<div className="lg:col-span-1">
					<CreditsCard />
				</div>
			</div>
		</div>
	);
}
