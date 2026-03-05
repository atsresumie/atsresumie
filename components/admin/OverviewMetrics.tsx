"use client";

import { useEffect, useState } from "react";
import {
	Users,
	CreditCard,
	AlertTriangle,
	Mail,
	TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface OverviewData {
	totalUsers: number;
	activeSubscriptions: number;
	creditsGranted7d: number;
	failedJobs24h: number;
	emailsSent7d: number;
}

export function OverviewMetrics() {
	const [data, setData] = useState<OverviewData | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		fetch("/api/admin/overview")
			.then((r) => r.json())
			.then((d) => setData(d))
			.catch(console.error)
			.finally(() => setLoading(false));
	}, []);

	const metrics = [
		{
			label: "Total Users",
			value: data?.totalUsers ?? 0,
			icon: Users,
			color: "text-blue-600",
		},
		{
			label: "Active Subscriptions",
			value: data?.activeSubscriptions ?? 0,
			icon: TrendingUp,
			color: "text-emerald-600",
		},
		{
			label: "Credits Granted (7d)",
			value: data?.creditsGranted7d ?? 0,
			icon: CreditCard,
			color: "text-amber-600",
		},
		{
			label: "Failed Jobs (24h)",
			value: data?.failedJobs24h ?? 0,
			icon: AlertTriangle,
			color: data?.failedJobs24h ? "text-red-600" : "text-text-tertiary",
		},
		{
			label: "Emails Sent (7d)",
			value: data?.emailsSent7d ?? 0,
			icon: Mail,
			color: "text-indigo-600",
		},
	];

	return (
		<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
			{metrics.map((metric) => {
				const Icon = metric.icon;
				return (
					<Card key={metric.label}>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium text-text-secondary">
								{metric.label}
							</CardTitle>
							<Icon size={16} className={metric.color} />
						</CardHeader>
						<CardContent>
							{loading ? (
								<Skeleton className="h-8 w-16" />
							) : (
								<div className="text-2xl font-bold">
									{metric.value.toLocaleString()}
								</div>
							)}
						</CardContent>
					</Card>
				);
			})}
		</div>
	);
}
