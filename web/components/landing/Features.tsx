import { Shield, Target, Code2, History, FileStack } from "lucide-react";

/**
 * Features Component - Server Component (no framer-motion)
 *
 * Uses CSS animations for performance. Pure server-rendered.
 */

const features = [
	{
		icon: Shield,
		title: "ATS-safe layout",
		description:
			"Clean, parseable structure that passes automated screening.",
	},
	{
		icon: Target,
		title: "Keyword alignment",
		description: "Match your resume to job requirements automatically.",
	},
	{
		icon: Code2,
		title: "LaTeX precision",
		description: "Professional typesetting with full source access.",
	},
	{
		icon: History,
		title: "Version history",
		description: "Track changes and revert to previous versions.",
	},
	{
		icon: FileStack,
		title: "1–2 page control",
		description: "Automatically fit your content to the right length.",
	},
];

export const Features = () => {
	return (
		<section id="features" className="relative py-24 md:py-32">
			<div className="container mx-auto">
				{/* Section header */}
				<div className="text-center mb-12 md:mb-16 animate-fade-in-up">
					<h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold mb-4">
						Key benefits
					</h2>
					<p className="text-lg text-muted-foreground max-w-2xl mx-auto">
						Everything you need to create a resume that gets past
						the algorithms
					</p>
				</div>

				{/* Features grid */}
				<div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
					{features.map((feature, index) => {
						const Icon = feature.icon;
						return (
							<div
								key={feature.title}
								className={`group relative animate-fade-in-up animation-delay-${(index + 1) * 100}`}
							>
								<div className="relative bg-surface-raised rounded-sm border border-border-visible p-6 h-full transition-all duration-300 hover:border-accent/30 hover:-translate-y-1">
									{/* Glow effect on hover */}
									<div className="absolute inset-0 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
										<div className="absolute inset-0 rounded-sm bg-gradient-to-br from-accent/10 to-transparent" />
									</div>

									{/* Content */}
									<div className="relative z-10">
										{/* Icon */}
										<div className="w-12 h-12 rounded-sm bg-surface-inset flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110">
											<Icon
												size={22}
												className="text-accent"
											/>
										</div>

										{/* Text */}
										<h3 className="font-display text-lg font-medium mb-2 text-text-primary">
											{feature.title}
										</h3>
										<p className="text-sm text-text-secondary">
											{feature.description}
										</p>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
};
