import { AlertTriangle, ArrowRight } from "lucide-react";

/**
 * Problem Section - Server Component
 *
 * Neutral framing: acknowledges the generic-prompt workflow and positions
 * ATSResumie as the purpose-built alternative. No brand-bashing.
 */

const issues = [
	"Inconsistent formatting",
	"Vague, generic bullets",
	"Missing JD keywords",
	"May overclaim or assume",
];

export const Problem = () => {
	return (
		<section className="relative py-24 md:py-32 overflow-hidden">
			{/* Background */}
			<div className="absolute inset-0 bg-gradient-to-b from-surface-raised/30 via-surface-base to-surface-base" />

			<div className="container mx-auto relative z-10">
				<div className="max-w-3xl mx-auto text-center animate-fade-in-up">
					{/* Icon */}
					<div className="inline-flex items-center justify-center w-14 h-14 rounded-sm bg-surface-raised border border-border-visible mb-6">
						<AlertTriangle size={24} className="text-warning" />
					</div>

					{/* Title */}
					<h2 className="font-display text-2xl md:text-3xl lg:text-4xl font-semibold mb-5 leading-snug">
						Generic prompts only get you so far
					</h2>

					{/* Body */}
					<p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-8 animate-fade-in-up animation-delay-200">
						Pasting your resume and a job description into a chat
						prompt is a smart start — but without purpose-built
						tailoring, the output is often unreliable.
					</p>

					{/* Issue pills */}
					<div className="flex flex-wrap justify-center gap-2.5 mb-8 animate-fade-in-up animation-delay-300">
						{issues.map((issue) => (
							<span
								key={issue}
								className="inline-flex items-center gap-1.5 text-sm px-3.5 py-1.5 rounded-full bg-warning-muted/60 text-warning border border-warning/15"
							>
								<span className="w-1 h-1 rounded-full bg-warning/60" />
								{issue}
							</span>
						))}
					</div>

					{/* CTA line */}
					<p className="text-base text-text-secondary animate-fade-in-up animation-delay-400">
						Want consistent, job-specific tailoring?{" "}
						<a
							href="/get-started"
							className="inline-flex items-center gap-1 text-accent font-medium hover:text-accent-hover transition-colors"
						>
							Try ATSResumie
							<ArrowRight size={14} />
						</a>
					</p>
				</div>
			</div>
		</section>
	);
};
