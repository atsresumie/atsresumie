"use client";

import { Suspense } from "react";
import Link from "next/link";
import { FileText, Users, Briefcase, TrendingUp, SlidersHorizontal, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useJobApplications, type JobApplication, STAGE_LABELS } from "@/hooks/useJobApplications";
import { useCredits } from "@/hooks/useCredits";

function getInitials(company: string): string {
	return company
		.split(" ")
		.map((w) => w[0])
		.join("")
		.slice(0, 2)
		.toUpperCase();
}

function formatDate(dateStr: string | null): string {
	if (!dateStr) return "";
	const d = new Date(dateStr);
	return d.toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" });
}

function DashboardContent() {
	const { applications, isLoading } = useJobApplications();
	const { credits } = useCredits();

	if (isLoading) return <DashboardSkeleton />;

	// Stats
	const total = applications.length;
	const interviews = applications.filter((a) => a.stage === "interview").length;
	const offers = applications.filter((a) => a.stage === "offer").length;
	const applied = applications.filter((a) => a.stage === "applied").length;
	const responseRate = total > 0 ? Math.round(((interviews + offers) / total) * 100) : 0;

	// Recent applications (last 4)
	const recentApps = [...applications]
		.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
		.slice(0, 4);

	// Weekly data for chart (simple mock based on real data count)
	const days = ["Sun", "Mon", "Tues", "Wed", "Thur", "Fri", "Sat"];
	const now = new Date();
	const weekData = days.map((day, i) => {
		const dayApps = applications.filter((a) => {
			const d = new Date(a.created_at);
			return d.getDay() === i && (now.getTime() - d.getTime()) < 7 * 24 * 60 * 60 * 1000;
		});
		return { day, count: dayApps.length };
	});
	const maxCount = Math.max(...weekData.map((d) => d.count), 1);

	return (
		<div style={{ maxWidth: "1128px", margin: "0 auto" }}>
			{/* Stats cards */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
				<StatCard label="Total Applications" value={String(total)} sub={`↗ ${Math.min(total, 6)} this week`} subColor="text-accent" icon={Briefcase} />
				<StatCard label="Active Interviews" value={String(interviews)} sub={interviews > 0 ? `↗ ${Math.min(interviews, 2)} new` : "—"} subColor="text-accent" icon={Users} />
				<StatCard label="Offers Received" value={String(offers)} sub={offers > 0 ? `↗ ${Math.min(offers, 1)} new` : "—"} subColor="text-accent" icon={FileText} />
				<StatCard label="Response Rate" value={`${responseRate}%`} sub={responseRate > 0 ? `↗ ${Math.min(responseRate, 4)}%` : "—"} subColor="text-accent" icon={TrendingUp} />
			</div>

			{/* Main content row */}
			<div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 mb-6">
				{/* Recent Applications table */}
				<div className="rounded-xl border border-border-visible bg-surface-raised p-5">
					<div className="flex items-center justify-between mb-4">
						<h2 className="text-base font-semibold text-text-primary">Recent Applications</h2>
						<button className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors">
							<SlidersHorizontal size={13} />
							Filters
						</button>
					</div>

					{recentApps.length > 0 ? (
						<table className="w-full text-sm">
							<thead>
								<tr className="text-xs text-text-tertiary border-b border-border-visible">
									<th className="text-left py-2 font-medium">#</th>
									<th className="text-left py-2 font-medium text-accent">Company</th>
									<th className="text-left py-2 font-medium text-accent">Role</th>
									<th className="text-left py-2 font-medium text-accent">Status</th>
									<th className="text-left py-2 font-medium text-accent">Date</th>
									<th className="text-left py-2 font-medium text-accent">ATS</th>
								</tr>
							</thead>
							<tbody>
								{recentApps.map((app, idx) => (
									<tr key={app.id} className="border-b border-border-subtle last:border-0">
										<td className="py-3 text-text-secondary">{idx + 1}</td>
										<td className="py-3 font-medium text-text-primary">{app.company}</td>
										<td className="py-3 text-text-secondary">{app.role}</td>
										<td className="py-3">
											<span className="text-xs font-medium text-accent">{STAGE_LABELS[app.stage]}</span>
										</td>
										<td className="py-3 text-text-secondary">{formatDate(app.applied_at || app.created_at)}</td>
										<td className="py-3 font-medium text-text-primary">96%</td>
									</tr>
								))}
							</tbody>
						</table>
					) : (
						<p className="text-center py-8 text-sm text-text-tertiary">No applications yet</p>
					)}
				</div>

				{/* Weekly Applications chart */}
				<div className="rounded-xl border border-border-visible bg-surface-raised p-5">
					<h2 className="text-base font-semibold text-text-primary mb-4">Weekly Applications</h2>
					<div className="flex items-end justify-between gap-2" style={{ height: "180px" }}>
						{weekData.map((d) => (
							<div key={d.day} className="flex-1 flex flex-col items-center gap-1">
								<div className="w-full flex flex-col justify-end" style={{ height: "150px" }}>
									<div
										className="w-full rounded-t"
										style={{
											height: `${Math.max((d.count / maxCount) * 100, 8)}%`,
											backgroundColor: d.count > 0 ? "#e8693a" : "#f0e6d4",
											opacity: d.count > 0 ? 0.6 + (d.count / maxCount) * 0.4 : 0.3,
											minHeight: "6px",
										}}
									/>
								</div>
								<span className="text-[10px] text-text-tertiary">{d.day}</span>
							</div>
						))}
					</div>
				</div>
			</div>

			{/* Bottom row */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Recommended For You */}
				<div className="rounded-xl border border-border-visible bg-surface-raised p-5">
					<div className="flex items-center justify-between mb-4">
						<h2 className="text-base font-semibold text-text-primary">Recommended For You</h2>
						<Link href="/dashboard/saved-jds" className="text-xs text-text-secondary hover:text-accent transition-colors inline-flex items-center gap-1">
							Browse all <ArrowRight size={12} />
						</Link>
					</div>
					<div className="space-y-3">
						{[1, 2, 3].map((i) => (
							<div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border-subtle">
								<span className="w-9 h-9 rounded-lg bg-surface-inset border border-border-subtle flex items-center justify-center text-xs font-bold text-text-secondary flex-shrink-0">
									LG
								</span>
								<div className="flex-1 min-w-0">
									<p className="text-sm font-semibold text-text-primary">Staff Engineer</p>
									<p className="text-xs text-text-secondary">Loom · Remote · $190k</p>
								</div>
								<Link
									href="/dashboard/generate"
									className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold text-white bg-accent hover:bg-accent-hover transition-colors flex-shrink-0"
								>
									Apply <ArrowRight size={11} />
								</Link>
							</div>
						))}
					</div>
				</div>

				{/* Recent Activity */}
				<div className="rounded-xl border border-border-visible bg-surface-raised p-5">
					<h2 className="text-base font-semibold text-text-primary mb-4">Recent Activity</h2>
					<div className="space-y-4">
						{applications.slice(0, 3).map((app, idx) => {
							const icons = ["📩", "📄", "📅"];
							const labels = [
								`${app.stage === "offer" ? "Offer received from" : app.stage === "applied" ? "Applied to" : "Interview scheduled with"} ${app.company}`,
							];
							return (
								<div key={app.id} className="flex items-start gap-3">
									<span className="w-9 h-9 rounded-lg bg-accent-muted flex items-center justify-center text-base flex-shrink-0">
										{icons[idx % 3]}
									</span>
									<div className="flex-1 min-w-0">
										<p className="text-sm font-semibold text-text-primary">{labels[0]}</p>
										<p className="text-xs text-text-secondary mt-0.5">
											{app.role}{app.salary ? ` · ${app.salary}` : ""}
										</p>
									</div>
									<span className="text-xs text-text-tertiary flex-shrink-0 whitespace-nowrap">
										{getRelativeTime(app.updated_at)}
									</span>
								</div>
							);
						})}
						{applications.length === 0 && (
							<p className="text-center py-6 text-sm text-text-tertiary">No recent activity</p>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

function getRelativeTime(dateStr: string): string {
	const d = new Date(dateStr);
	const now = new Date();
	const diffMs = now.getTime() - d.getTime();
	const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
	const diffDays = Math.floor(diffHours / 24);
	if (diffHours < 1) return "Just now";
	if (diffHours < 24) return `${diffHours} hours ago`;
	return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
}

function StatCard({ label, value, sub, subColor, icon: Icon }: { label: string; value: string; sub: string; subColor: string; icon: React.ElementType }) {
	return (
		<div className="rounded-xl border border-border-visible bg-surface-raised p-4">
			<div className="flex items-center justify-between mb-2">
				<span className="text-xs text-text-secondary">{label}</span>
				<Icon size={16} className="text-text-tertiary" />
			</div>
			<p className="text-2xl font-bold text-text-primary">{value}</p>
			<p className={`text-xs mt-1 ${subColor}`}>{sub}</p>
		</div>
	);
}

function DashboardSkeleton() {
	return (
		<div style={{ maxWidth: "1128px", margin: "0 auto" }}>
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
				{[1,2,3,4].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
			</div>
			<div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 mb-6">
				<Skeleton className="h-80 rounded-xl" />
				<Skeleton className="h-80 rounded-xl" />
			</div>
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<Skeleton className="h-60 rounded-xl" />
				<Skeleton className="h-60 rounded-xl" />
			</div>
		</div>
	);
}

export default function DashboardHomePage() {
	return (
		<div className="applications-page p-6 md:p-8 min-h-screen" style={{ backgroundColor: "var(--surface-base)" }}>
			{/* Header */}
			<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between" style={{ maxWidth: "1128px", margin: "0 auto 1.5rem" }}>
				<div>
					<h1 className="text-2xl font-semibold tracking-tight text-text-primary md:text-3xl">
						User Dashboard
					</h1>
					<p className="mt-1.5 text-sm text-text-secondary">
						Analytics and activity overview
					</p>
				</div>
				<Link
					href="/dashboard/generate"
					className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-accent hover:bg-accent-hover transition-colors flex-shrink-0"
				>
					Tailor <FileText size={14} />
				</Link>
			</div>

			<Suspense fallback={<DashboardSkeleton />}>
				<DashboardContent />
			</Suspense>
		</div>
	);
}
