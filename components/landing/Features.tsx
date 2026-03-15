import { Target, Shield, Copy, Zap, BarChart3, KanbanSquare } from "lucide-react";

/**
 * Features — Server Component
 *
 * 6 concise cards in 3×2 grid. Heading + one short line max.
 * New cards for upcoming capabilities carry "Coming soon" badges.
 */

const features = [
	{
		icon: Target,
		title: "Job-specific tailoring",
		line: "Aligned to the JD, grounded in your experience",
	},
	{
		icon: Shield,
		title: "ATS-friendly formatting",
		line: "Clean structure that passes screening",
	},
	{
		icon: Copy,
		title: "Multiple versions",
		line: "One resume per application",
	},
	{
		icon: Zap,
		title: "Fast iterations",
		line: "Compare results, iterate quickly",
	},
	{
		icon: BarChart3,
		title: "See ATS fit",
		line: "Quick signals on resume-to-job fit",
		badge: "Coming soon",
	},
	{
		icon: KanbanSquare,
		title: "Track applications",
		line: "One board for your job search",
		badge: "Coming soon",
	},
];

export const Features = () => {
	return (
		<section id="features" className="py-20 md:py-28">
			<div className="container mx-auto px-4">
				<h2 className="font-display text-2xl md:text-3xl font-semibold text-center mb-14">
					Why ATSResumie
				</h2>

				<div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-4xl mx-auto">
					{features.map((feature) => {
						const Icon = feature.icon;
						return (
							<div
								key={feature.title}
								className="p-6 rounded-xl bg-surface-raised border border-border-visible"
							>
								<div className="flex items-center gap-3 mb-4">
									<div className="w-10 h-10 rounded-lg bg-accent-muted flex items-center justify-center flex-shrink-0">
										<Icon
											size={20}
											className="text-accent"
										/>
									</div>
									{(feature as { badge?: string }).badge && (
										<span className="inline-flex items-center px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider rounded-full bg-accent-muted text-accent border border-accent/15">
											{(feature as { badge?: string }).badge}
										</span>
									)}
								</div>
								<h3 className="font-display text-base font-medium text-text-primary mb-1">
									{feature.title}
								</h3>
								<p className="text-sm text-text-secondary">
									{feature.line}
								</p>
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
};
