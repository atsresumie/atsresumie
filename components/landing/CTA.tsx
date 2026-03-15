import { ArrowRight } from "lucide-react";
import Link from "next/link";

/**
 * CTA — Server Component
 *
 * Bold final CTA. "Stop Applying. Start Landing." with two action buttons.
 */

export const CTA = () => {
	return (
		<section className="py-24 md:py-32">
			<div className="container mx-auto px-4">
				<div className="max-w-2xl mx-auto text-center">
					{/* Bold headline */}
					<h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-tight mb-1 text-text-primary">
						Stop Applying.
					</h2>
					{/* Outlined / lighter headline */}
					<h2
						className="font-display text-4xl md:text-5xl lg:text-6xl font-bold uppercase tracking-tight mb-8"
						style={{
							WebkitTextStroke: "1.5px var(--text-tertiary)",
							WebkitTextFillColor: "transparent",
						}}
					>
						Start Landing.
					</h2>

					{/* Supporting copy */}
					<p className="text-base md:text-lg text-text-secondary mb-10 max-w-lg mx-auto">
						Join thousands of job seekers who get more interviews with
						tailored, ATS-optimized resumes — in minutes, not hours.
					</p>

					{/* CTA buttons */}
					<div className="flex flex-col sm:flex-row items-center justify-center gap-4">
						<Link
							href="/get-started"
							className="inline-flex items-center gap-2 px-8 py-3.5 bg-cta text-cta-foreground font-semibold rounded-lg hover:bg-cta-hover transition-all hover:-translate-y-0.5 active:scale-[0.98]"
						>
							Get 3 free credits
							<ArrowRight size={16} />
						</Link>
						<Link
							href="#features"
							className="inline-flex items-center gap-2 px-8 py-3.5 font-semibold rounded-lg border border-border-visible text-text-primary hover:bg-surface-raised transition-all hover:-translate-y-0.5 active:scale-[0.98]"
						>
							Browse live jobs
						</Link>
					</div>
				</div>
			</div>
		</section>
	);
};
