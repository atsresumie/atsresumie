import { Bookmark, Send, MessageSquare, Trophy } from "lucide-react";

/**
 * JobTracker — Server Component
 *
 * Kanban-style product preview. 4 columns: Saved → Applied → Interview → Offer.
 * Tagged "Coming soon".
 */

const columns = [
	{
		title: "Saved",
		icon: Bookmark,
		color: "text-text-secondary",
		bgColor: "bg-surface-inset/60",
		cards: [
			{ company: "Stripe", role: "Frontend Engineer", dotColor: "bg-info" },
			{ company: "Vercel", role: "Full Stack Dev", dotColor: "bg-accent" },
		],
	},
	{
		title: "Applied",
		icon: Send,
		color: "text-info",
		bgColor: "bg-info-muted/40",
		cards: [
			{ company: "Linear", role: "Product Engineer", dotColor: "bg-info" },
		],
	},
	{
		title: "Interview",
		icon: MessageSquare,
		color: "text-warning",
		bgColor: "bg-warning-muted/40",
		cards: [
			{ company: "Notion", role: "Software Engineer", dotColor: "bg-warning" },
		],
	},
	{
		title: "Offer",
		icon: Trophy,
		color: "text-success",
		bgColor: "bg-success-muted/40",
		cards: [
			{ company: "Figma", role: "Senior Frontend", dotColor: "bg-success" },
		],
	},
];

export const JobTracker = () => {
	return (
		<section className="py-20 md:py-28 bg-surface-inset/30">
			<div className="container mx-auto px-4">
				{/* Section header */}
				<div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4">
					<h2 className="font-display text-2xl md:text-3xl font-semibold text-center">
						Track every application
					</h2>
					<span className="inline-flex items-center px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-accent-muted text-accent border border-accent/15">
						Coming soon
					</span>
				</div>
				<p className="text-sm text-text-secondary text-center mb-12 max-w-sm mx-auto">
					From saved to offer in one board.
				</p>

				{/* Kanban board preview */}
				<div className="max-w-4xl mx-auto overflow-x-auto pb-2">
					<div className="grid grid-cols-2 md:grid-cols-4 gap-3 min-w-[480px]">
						{columns.map((col) => {
							const Icon = col.icon;
							return (
								<div
									key={col.title}
									className="rounded-xl bg-surface-raised border border-border-visible p-3"
								>
									{/* Column header */}
									<div className="flex items-center gap-2 mb-3 px-1">
										<Icon size={14} className={col.color} />
										<span className="text-xs font-semibold text-text-primary">
											{col.title}
										</span>
										<span className="ml-auto text-[10px] text-text-tertiary font-medium">
											{col.cards.length}
										</span>
									</div>

									{/* Cards */}
									<div className="space-y-2">
										{col.cards.map((card) => (
											<div
												key={`${card.company}-${card.role}`}
												className={`rounded-lg ${col.bgColor} border border-border-subtle/50 p-3`}
											>
												<div className="flex items-center gap-2 mb-1">
													<span
														className={`w-1.5 h-1.5 rounded-full ${card.dotColor} flex-shrink-0`}
													/>
													<span className="text-xs font-semibold text-text-primary truncate">
														{card.company}
													</span>
												</div>
												<p className="text-[11px] text-text-secondary pl-3.5 truncate">
													{card.role}
												</p>
											</div>
										))}
									</div>
								</div>
							);
						})}
					</div>
				</div>
			</div>
		</section>
	);
};
