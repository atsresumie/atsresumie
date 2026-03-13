import { Target, Clock, AlertTriangle } from "lucide-react";

/**
 * Problem Section — Server Component
 *
 * 3 visual cards with icon + short label. No paragraphs.
 */

const painPoints = [
	{
		icon: Target,
		label: "Generic resumes get ignored",
	},
	{
		icon: Clock,
		label: "Rewriting for every job is slow",
	},
	{
		icon: AlertTriangle,
		label: "AI tools can overclaim or misformat",
	},
];

export const Problem = () => {
	return (
		<section className="py-20 md:py-28">
			<div className="container mx-auto px-4">
				<h2 className="font-display text-2xl md:text-3xl font-semibold text-center mb-12">
					Sound familiar?
				</h2>

				<div className="grid md:grid-cols-3 gap-5 max-w-3xl mx-auto">
					{painPoints.map((point) => {
						const Icon = point.icon;
						return (
							<div
								key={point.label}
								className="flex flex-col items-center text-center p-6 rounded-xl bg-surface-raised border border-border-visible"
							>
								<div className="w-11 h-11 rounded-lg bg-warning-muted flex items-center justify-center mb-4">
									<Icon
										size={20}
										className="text-warning"
									/>
								</div>
								<p className="text-sm font-medium text-text-primary">
									{point.label}
								</p>
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
};
