import { Target, Shield, Copy, Zap } from "lucide-react";

/**
 * Features — Server Component
 *
 * 4 concise cards in 2×2 grid. Heading + one short line max.
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
];

export const Features = () => {
	return (
		<section id="features" className="py-20 md:py-28">
			<div className="container mx-auto px-4">
				<h2 className="font-display text-2xl md:text-3xl font-semibold text-center mb-14">
					Why ATSResumie
				</h2>

				<div className="grid sm:grid-cols-2 gap-5 max-w-2xl mx-auto">
					{features.map((feature) => {
						const Icon = feature.icon;
						return (
							<div
								key={feature.title}
								className="p-6 rounded-xl bg-surface-raised border border-border-visible"
							>
								<div className="w-10 h-10 rounded-lg bg-accent-muted flex items-center justify-center mb-4">
									<Icon
										size={20}
										className="text-accent"
									/>
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
