"use client";

import { Sparkles, History, FileText, Download } from "lucide-react";
import { QuickActionCard } from "./QuickActionCard";

const quickActions = [
	{
		icon: Sparkles,
		title: "Generate",
		description: "Create an ATS-optimized resume",
		href: "/dashboard/generate",
	},
	{
		icon: History,
		title: "Past Generations",
		description: "View your generation history",
		href: "/dashboard/generations",
	},
	{
		icon: FileText,
		title: "Resume Versions",
		description: "Manage your saved resumes",
		href: "/dashboard/resumes",
	},
	{
		icon: Download,
		title: "Download Center",
		description: "Access your exported files",
		href: "/dashboard/downloads",
	},
];

export function QuickActionsGrid() {
	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
			{quickActions.map((action) => (
				<QuickActionCard
					key={action.href}
					icon={action.icon}
					title={action.title}
					description={action.description}
					href={action.href}
				/>
			))}
		</div>
	);
}
