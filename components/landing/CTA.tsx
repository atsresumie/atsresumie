import { ArrowRight } from "lucide-react";
import Link from "next/link";

/**
 * CTA Component - Server Component (no framer-motion)
 */

export const CTA = () => {
	return (
		<section className="relative py-24 md:py-32 overflow-hidden">
			{/* Background */}
			<div className="absolute inset-0 bg-gradient-to-b from-surface-raised/20 to-surface-base" />

			{/* Decorative elements - CSS animations */}
			<div
				className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full opacity-10 animate-float-slow"
				style={{
					background:
						"radial-gradient(circle, hsl(36, 30%, 70%) 0%, transparent 70%)",
					filter: "blur(60px)",
				}}
			/>
			<div
				className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full opacity-10 animate-float-reverse"
				style={{
					background:
						"radial-gradient(circle, hsl(32, 28%, 66%) 0%, transparent 70%)",
					filter: "blur(40px)",
				}}
			/>

			<div className="container mx-auto relative z-10">
				<div className="max-w-3xl mx-auto text-center animate-fade-in-up">
					<h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold mb-6">
						Stop prompt-engineering.{" "}
						<span className="text-gradient">
							Tailor your resume the right way.
						</span>
					</h2>

					<div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8 animate-fade-in-up animation-delay-200">
						<Link
							href="/get-started"
							className="group inline-flex items-center gap-2 px-8 py-4 bg-accent text-accent-foreground font-semibold rounded-sm hover:bg-accent-hover transition-all hover:-translate-y-0.5 active:scale-[0.98]"
						>
							Get started
							<ArrowRight
								size={18}
								className="transition-transform group-hover:translate-x-1"
							/>
						</Link>
					</div>

					<p className="text-sm text-text-secondary animate-fade-in animation-delay-400">
						3 free credits on signup · No credit card required
					</p>
				</div>
			</div>
		</section>
	);
};
