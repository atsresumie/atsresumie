import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { Check, Zap } from "lucide-react";

const plans = [
	{
		name: "Free",
		description: "Get started with 3 credits",
		price: "$0",
		period: "",
		features: [
			"3 credits included",
			"Preview uses 1 credit",
			"Export is free",
			"PDF download",
			"LaTeX source included",
		],
		cta: "Get Started",
		popular: false,
	},
	{
		name: "Pro",
		description: "For serious job seekers",
		price: "$19",
		period: "/month",
		features: [
			"Unlimited credits",
			"Unlimited versions",
			"Premium templates",
			"Priority processing",
			"Version history",
		],
		cta: "Go Pro",
		popular: true,
	},
];

export const Pricing = () => {
	const containerRef = useRef<HTMLDivElement>(null);
	const isInView = useInView(containerRef, { once: true, margin: "-100px" });
	const prefersReducedMotion = useReducedMotion();

	const scrollToStart = () => {
		const element = document.querySelector("#start");
		element?.scrollIntoView({ behavior: "smooth" });
	};

	return (
		<section id="pricing" className="relative py-24 md:py-32">
			<div ref={containerRef} className="container mx-auto">
				{/* Section header */}
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					animate={isInView ? { opacity: 1, y: 0 } : {}}
					transition={{ type: "spring", damping: 20 }}
					className="text-center mb-12 md:mb-16"
				>
					<h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold mb-4">
						Simple pricing
					</h2>
					<p className="text-lg text-muted-foreground max-w-2xl mx-auto">
						Start free, upgrade when you need more
					</p>
				</motion.div>

				{/* Pricing cards */}
				<div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
					{plans.map((plan, index) => (
						<motion.div
							key={plan.name}
							initial={{ opacity: 0, y: 40 }}
							animate={isInView ? { opacity: 1, y: 0 } : {}}
							transition={{
								delay: prefersReducedMotion
									? 0
									: 0.2 + index * 0.15,
								type: "spring",
								damping: 20,
							}}
							className="relative group"
						>
							{/* Animated gradient border for Pro */}
							{plan.popular && (
								<motion.div
									className="absolute -inset-px rounded-2xl z-0"
									style={{
										background:
											"linear-gradient(135deg, hsl(var(--coffee-light)), hsl(var(--sand)), hsl(var(--beige)), hsl(var(--coffee-light)))",
										backgroundSize: "300% 300%",
									}}
									animate={
										prefersReducedMotion
											? {}
											: {
													backgroundPosition: [
														"0% 0%",
														"100% 100%",
														"0% 0%",
													],
												}
									}
									transition={{
										duration: 5,
										repeat: Infinity,
										ease: "linear",
									}}
								/>
							)}

							<div
								className={`relative h-full bg-card-gradient rounded-2xl border p-8 ${
									plan.popular
										? "border-transparent"
										: "border-border/50"
								}`}
							>
								{/* Popular badge */}
								{plan.popular && (
									<div className="absolute -top-3 left-1/2 -translate-x-1/2">
										<div className="flex items-center gap-1.5 px-3 py-1 bg-sand text-secondary-foreground text-sm font-medium rounded-full">
											<Zap size={12} />
											Popular
										</div>
									</div>
								)}

								{/* Plan info */}
								<div className="mb-6">
									<h3 className="font-display text-2xl font-semibold mb-1">
										{plan.name}
									</h3>
									<p className="text-muted-foreground text-sm">
										{plan.description}
									</p>
								</div>

								{/* Price */}
								<div className="mb-8">
									<span className="font-display text-5xl font-bold">
										{plan.price}
									</span>
									<span className="text-muted-foreground">
										{plan.period}
									</span>
								</div>

								{/* Features */}
								<ul className="space-y-4 mb-8">
									{plan.features.map((feature) => (
										<li
											key={feature}
											className="flex items-center gap-3"
										>
											<div className="w-5 h-5 rounded-full bg-sand/20 flex items-center justify-center flex-shrink-0">
												<Check
													size={12}
													className="text-sand"
												/>
											</div>
											<span className="text-sm">
												{feature}
											</span>
										</li>
									))}
								</ul>

								{/* CTA */}
								<motion.button
									onClick={scrollToStart}
									className={`w-full py-3.5 px-4 font-medium rounded-xl transition-all ${
										plan.popular
											? "bg-secondary text-secondary-foreground shadow-soft hover:shadow-glow"
											: "bg-muted/50 text-foreground hover:bg-muted"
									}`}
									whileHover={{ scale: 1.02, y: -2 }}
									whileTap={{ scale: 0.98 }}
								>
									{plan.cta}
								</motion.button>
							</div>
						</motion.div>
					))}
				</div>

				{/* Microcopy */}
				<motion.p
					initial={{ opacity: 0 }}
					animate={isInView ? { opacity: 1 } : {}}
					transition={{ delay: 0.6 }}
					className="text-center text-sm text-muted-foreground mt-8"
				>
					Need more credits? Buy additional credit packs anytime.
				</motion.p>
			</div>
		</section>
	);
};
