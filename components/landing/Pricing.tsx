"use client";

import { useState } from "react";
import { Check, Zap, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { useAuth } from "@/hooks/useAuth";
import { useAuthIntent } from "@/hooks/useAuthIntent";

/**
 * Pricing Component - Client Component (for checkout logic)
 * Uses CSS animations instead of framer-motion
 */

const plans = [
	{
		id: "free",
		name: "Free",
		description: "Get started with 3 credits",
		price: "$0",
		period: "",
		features: [
			"3 credits on signup",
			"1 credit per generation",
			"Export is always free",
			"PDF download included",
		],
		cta: "Get Started",
		popular: false,
	},
	{
		id: "pro_75",
		name: "Pro",
		description: "75 credits every month",
		price: "$10",
		period: "/mo",
		features: [
			"75 credits per month",
			"Unlimited PDF exports",
			"Priority support",
			"Cancel anytime",
		],
		cta: "Subscribe",
		popular: true,
	},
];

export const Pricing = () => {
	const { openAuthModal } = useAuthModal();
	const { isAuthenticated } = useAuth();
	const { saveIntent } = useAuthIntent();
	const [isLoading, setIsLoading] = useState(false);

	const scrollToStart = () => {
		const element = document.querySelector("#start");
		element?.scrollIntoView({ behavior: "smooth" });
	};

	const handleBuyPro = async () => {
		if (isLoading) return;

		if (!isAuthenticated) {
			saveIntent({ type: "buy_credits", payload: { packId: "pro_75" } });
			toast.info("Please sign in to purchase credits");
			openAuthModal("signin");
			return;
		}

		setIsLoading(true);
		try {
			const res = await fetch("/api/stripe/checkout", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ packId: "pro_75" }),
			});

			const data = await res.json();

			if (!res.ok) {
				if (res.status === 401) {
					saveIntent({
						type: "buy_credits",
						payload: { packId: "pro_75" },
					});
					toast.info("Session expired. Please sign in again.");
					openAuthModal("signin");
					setIsLoading(false);
					return;
				}
				throw new Error(data.error || "Failed to start checkout");
			}

			if (!data.url) {
				throw new Error("No checkout URL returned");
			}

			window.location.href = data.url;
		} catch (error) {
			console.error("Checkout error:", error);
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to start checkout",
			);
			setIsLoading(false);
		}
	};

	const handleCTA = (planId: string) => {
		if (planId === "pro_75") {
			handleBuyPro();
		} else {
			scrollToStart();
		}
	};

	return (
		<section id="pricing" className="relative py-24 md:py-32">
			<div className="container mx-auto">
				{/* Section header */}
				<div className="text-center mb-12 md:mb-16 animate-fade-in-up">
					<h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold mb-4">
						Simple pricing
					</h2>
					<p className="text-lg text-text-secondary max-w-2xl mx-auto">
						Start free, buy credits when you need more
					</p>
				</div>

				{/* Pricing cards */}
				<div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
					{plans.map((plan, index) => (
						<div
							key={plan.name}
							className={`relative group animate-fade-in-up animation-delay-${(index + 2) * 100}`}
						>
							{/* Gradient border for Pro */}
							{plan.popular && (
								<div
									className="absolute -inset-px rounded-sm z-0 animate-gradient-shift"
									style={{
										background:
											"linear-gradient(135deg, var(--accent), hsl(36, 30%, 70%), var(--accent))",
										backgroundSize: "300% 300%",
									}}
								/>
							)}

							<div
								className={`relative h-full bg-surface-raised rounded-sm border p-8 ${
									plan.popular
										? "border-transparent"
										: "border-border-visible"
								}`}
							>
								{/* Popular badge */}
								{plan.popular && (
									<div className="absolute -top-3 left-1/2 -translate-x-1/2">
										<div className="flex items-center gap-1.5 px-3 py-1 bg-success text-white text-sm font-semibold rounded-full shadow-lg">
											<Zap size={12} />
											Best Value
										</div>
									</div>
								)}

								{/* Plan info */}
								<div className="mb-6">
									<h3 className="font-display text-2xl font-semibold mb-1">
										{plan.name}
									</h3>
									<p className="text-text-secondary text-sm">
										{plan.description}
									</p>
								</div>

								{/* Price */}
								<div className="mb-8">
									<span className="font-display text-5xl font-bold">
										{plan.price}
									</span>
									<span className="text-text-secondary">
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
											<div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
												<Check
													size={12}
													className="text-accent"
												/>
											</div>
											<span className="text-sm">
												{feature}
											</span>
										</li>
									))}
								</ul>

								{/* CTA */}
								<button
									onClick={() => handleCTA(plan.id)}
									disabled={plan.id === "pro_75" && isLoading}
									className={`w-full py-3.5 px-4 font-medium rounded-sm transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5 active:scale-[0.98] ${
										plan.popular
											? "bg-accent text-accent-foreground hover:bg-accent-hover"
											: "bg-surface-inset text-text-primary hover:bg-surface-overlay"
									} ${isLoading && plan.id === "pro_75" ? "opacity-70 cursor-not-allowed" : ""}`}
								>
									{plan.id === "pro_75" && isLoading ? (
										<>
											<Loader2
												size={16}
												className="animate-spin"
											/>
											Processing...
										</>
									) : (
										plan.cta
									)}
								</button>
							</div>
						</div>
					))}
				</div>

				{/* Microcopy */}
				<p className="text-center text-sm text-text-secondary mt-8 animate-fade-in animation-delay-600">
					Flexible plans. Cancel anytime, no hidden fees.
				</p>
			</div>
		</section>
	);
};
