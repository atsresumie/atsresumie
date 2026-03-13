import { ArrowRight } from "lucide-react";
import Link from "next/link";

/**
 * CTA — Server Component
 *
 * Calm final CTA. Short headline, short supporting line, simple button.
 */

export const CTA = () => {
	return (
		<section className="py-20 md:py-28">
			<div className="container mx-auto px-4">
				<div className="max-w-xl mx-auto text-center">
					<h2 className="font-display text-2xl md:text-3xl font-semibold mb-4">
						Ready to tailor your resume?
					</h2>

					<p className="text-sm text-text-secondary mb-8">
						3 free credits · No credit card required
					</p>

					<Link
						href="/get-started"
						className="inline-flex items-center gap-2 px-8 py-3.5 bg-cta text-cta-foreground font-semibold rounded-lg hover:bg-cta-hover transition-all hover:-translate-y-0.5 active:scale-[0.98]"
					>
						Start free
						<ArrowRight size={16} />
					</Link>
				</div>
			</div>
		</section>
	);
};
