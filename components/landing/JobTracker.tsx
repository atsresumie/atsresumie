"use client";

import { ArrowRight } from "lucide-react";

interface ApplicationCard {
	company: string;
	role: string;
	location: string;
	date: string;
	action: string;
	salary?: string;
	badge?: string;
	tall?: boolean;
}

interface KanbanColumn {
	title: string;
	count: number;
	cards: ApplicationCard[];
}

const columns: KanbanColumn[] = [
	{
		title: "Saved",
		count: 5,
		cards: [
			{
				company: "Notion",
				role: "UX Researcher",
				location: "Remote",
				date: "Saved on Mar 12",
				action: "View",
			},
			{
				company: "Notion",
				role: "UX Researcher",
				location: "Remote",
				date: "Saved on Mar 12",
				action: "View",
			},
			{
				company: "Figma",
				role: "UX Researcher",
				location: "Remote",
				date: "Mar 14",
				action: "View",
			},
		],
	},
	{
		title: "Interview",
		count: 5,
		cards: [
			{
				company: "Notion",
				role: "UX Researcher",
				location: "Remote",
				date: "Mar 12",
				action: "Prep",
				badge: "Tomorrow",
				tall: true,
			},
			{
				company: "Figma",
				role: "UX Researcher",
				location: "Remote",
				date: "Mar 14",
				action: "View",
			},
			{
				company: "Figma",
				role: "UX Researcher",
				location: "Remote",
				date: "Mar 14",
				action: "View",
			},
		],
	},
	{
		title: "Applied",
		count: 5,
		cards: [
			{
				company: "Notion",
				role: "Backend Engineer",
				location: "Remote",
				date: "Mar 12",
				action: "View",
			},
			{
				company: "Figma",
				role: "UX Researcher",
				location: "Remote",
				date: "Mar 14",
				action: "View",
			},
			{
				company: "Figma",
				role: "UX Researcher",
				location: "Remote",
				date: "Mar 14",
				action: "View",
			},
		],
	},
	{
		title: "Offer",
		count: 5,
		cards: [
			{
				company: "Shopify",
				role: "Full Stack Developer",
				location: "Remote",
				date: "Offer received",
				action: "Decide",
				salary: "$180k / yr",
				tall: true,
			},
			{
				company: "Figma",
				role: "UX Researcher",
				location: "Remote",
				date: "Mar 14",
				action: "View",
			},
			{
				company: "Figma",
				role: "UX Researcher",
				location: "Remote",
				date: "Mar 14",
				action: "View",
			},
		],
	},
];

export const JobTracker = () => {
	return (
		<section className="py-[60px] px-4 md:px-[120px]">
			<div className="max-w-[1200px] mx-auto flex flex-col gap-10">
				{/* Header */}
				<div className="flex flex-col items-center gap-5">
					<div className="flex items-center gap-3 flex-wrap justify-center">
						<h2 className="font-display text-[28px] md:text-[36px] font-bold text-text-primary">
							Track every application
						</h2>
						<span className="border border-accent text-accent text-xs font-semibold px-2 py-0.5 rounded-full bg-accent-muted">
							Coming Soon
						</span>
					</div>
					<p className="text-text-secondary text-base text-center">
						Manage your entire job search in one place.
					</p>
					<div className="flex items-center gap-0 text-base text-text-secondary">
						<span className="px-4">24 total</span>
						<span className="w-px h-5 bg-border-visible" />
						<span className="px-4">5 active interviews</span>
						<span className="w-px h-5 bg-border-visible" />
						<span className="px-4">2 offers pending</span>
					</div>
				</div>

				{/* Kanban Board */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
					{columns.map((col) => (
						<div
							key={col.title}
							className="border border-border-visible rounded-lg bg-surface-inset overflow-hidden flex flex-col"
						>
							<div className="p-3 flex flex-col gap-3">
								{/* Column header */}
								<div className="flex items-center justify-between">
									<span className="text-text-primary font-normal text-base">
										{col.title}
									</span>
									<span className="w-[17px] h-[17px] rounded-full bg-border-visible text-xs flex items-center justify-center text-text-secondary">
										{col.count}
									</span>
								</div>
								<div className="h-px bg-[#d9d9d9]" />

								{/* Cards */}
								<div className="flex flex-col gap-3">
									{col.cards.map((card, j) => (
										<div
											key={j}
											className="bg-white rounded-lg border border-border-subtle p-3 flex flex-col gap-2"
										>
											<div className="flex items-start gap-2.5">
												<div className="w-8 h-8 rounded-lg bg-surface-inset flex items-center justify-center text-xs font-medium text-text-tertiary flex-shrink-0">
													{card.company
														.substring(0, 2)
														.toUpperCase()}
												</div>
												<div className="flex flex-col min-w-0">
													<span className="font-semibold text-sm text-text-primary truncate">
														{card.role}
													</span>
													<span className="text-xs text-text-tertiary">
														{card.company} ·{" "}
														{card.location}
													</span>
												</div>
											</div>
											{card.badge && (
												<div className="flex items-center gap-1.5 text-xs text-text-tertiary">
													<span className="bg-surface-inset px-1.5 py-0.5 rounded text-xs">
														{card.badge}
													</span>
												</div>
											)}
											{card.salary && (
												<span className="font-semibold text-sm text-text-primary">
													{card.salary}
												</span>
											)}
											<div className="flex items-center justify-between">
												<span className="text-xs text-text-tertiary">
													{card.date}
												</span>
												<span className="text-xs text-accent font-normal inline-flex items-center gap-0.5 cursor-pointer hover:underline">
													{card.action}
													<ArrowRight className="w-3 h-3" />
												</span>
											</div>
										</div>
									))}
								</div>
							</div>

							{/* Add button */}
							<div className="p-3 mt-auto">
								<button className="w-full h-10 border border-border-visible rounded-[5px] text-sm text-text-secondary flex items-center justify-center gap-1.5 hover:bg-white transition-colors cursor-pointer">
									Add <span className="text-lg">+</span>
								</button>
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
};
