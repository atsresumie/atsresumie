import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { ArrowRight, Link } from "lucide-react";

export const CTA = () => {
	const containerRef = useRef<HTMLDivElement>(null);
	const isInView = useInView(containerRef, { once: true, margin: "-100px" });
	const prefersReducedMotion = useReducedMotion();

	const scrollToStart = () => {
		const element = document.querySelector("#start");
		element?.scrollIntoView({ behavior: "smooth" });
	};

	return (
		<section className="relative py-24 md:py-32 overflow-hidden">
			{/* Background */}
			<div className="absolute inset-0 bg-linear-to-b from-muted/20 to-background" />

			{/* Decorative elements */}
			<motion.div
				className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full opacity-10"
				style={{
					background:
						"radial-gradient(circle, hsl(36, 30%, 70%) 0%, transparent 70%)",
					filter: "blur(60px)",
				}}
				animate={prefersReducedMotion ? {} : { scale: [1, 1.2, 1] }}
				transition={{
					duration: 8,
					repeat: Infinity,
					ease: "easeInOut",
				}}
			/>
			<motion.div
				className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full opacity-10"
				style={{
					background:
						"radial-gradient(circle, hsl(32, 28%, 66%) 0%, transparent 70%)",
					filter: "blur(40px)",
				}}
				animate={prefersReducedMotion ? {} : { scale: [1.2, 1, 1.2] }}
				transition={{
					duration: 6,
					repeat: Infinity,
					ease: "easeInOut",
				}}
			/>

			<div ref={containerRef} className="container mx-auto relative z-10">
				<motion.div
					initial={{ opacity: 0, y: 40 }}
					animate={isInView ? { opacity: 1, y: 0 } : {}}
					transition={{ type: "spring", damping: 20 }}
					className="max-w-3xl mx-auto text-center"
				>
					<h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold mb-6">
						Generate your next resume in minutes.
					</h2>

					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={isInView ? { opacity: 1, y: 0 } : {}}
						transition={{ delay: 0.2, type: "spring", damping: 20 }}
						className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8"
					>
						<motion.button
							onClick={scrollToStart}
							className="group inline-flex items-center gap-2 px-8 py-4 bg-secondary text-secondary-foreground font-semibold rounded-xl shadow-soft hover:shadow-glow transition-all"
							whileHover={{ scale: 1.02, y: -2 }}
							whileTap={{ scale: 0.98 }}
						>
							Get Started
							<motion.span
								animate={
									prefersReducedMotion ? {} : { x: [0, 4, 0] }
								}
								transition={{ duration: 1.5, repeat: Infinity }}
							>
								<ArrowRight size={18} />
							</motion.span>
						</motion.button>
					</motion.div>

					<motion.p
						initial={{ opacity: 0 }}
						animate={isInView ? { opacity: 1 } : {}}
						transition={{ delay: 0.4 }}
						className="text-sm text-muted-foreground"
					>
						Preview free • Export with credits • LaTeX included
					</motion.p>
				</motion.div>
			</div>
		</section>
	);
};
