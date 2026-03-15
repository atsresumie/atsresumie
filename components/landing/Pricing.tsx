"use client";

import { useState } from "react";
import { Check, Zap, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { useAuth } from "@/hooks/useAuth";
import { useAuthIntent } from "@/hooks/useAuthIntent";

/**
 * Pricing — Client Component (checkout logic)
 *
 * Clean cards, minimal copy. Stripe checkout logic preserved.
 */

const plans = [
	{
		id: "free",
		name: "Free",
		price: "$0",
		period: "",
		features: [
			"3 credits on signup",
			"PDF download included",
			"Export is always free",
		],
		cta: "Start free",
		popular: false,
	},
	{
		id: "pro_75",
		name: "Pro",
		price: "$10",
		period: "/mo",
		features: [
			"50 credits per month",
			"Unlimited PDF exports",
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
		<section id="pricing" className="py-20 md:py-28">
			<div className="container mx-auto px-4">
				<h2 className="font-display text-3xl md:text-4xl font-bold text-center mb-14">
					Simple pricing
				</h2>

				<div className="grid md:grid-cols-2 gap-5 max-w-2xl mx-auto">
					{plans.map((plan) => (
						<div
							key={plan.name}
							className={`relative rounded-xl border p-7 ${
								plan.popular
									? "border-accent bg-surface-raised"
									: "border-border-visible bg-surface-raised"
							}`}
						>
							{/* Badge */}
							{plan.popular && (
								<div className="absolute -top-3 left-1/2 -translate-x-1/2">
									<span className="inline-flex items-center gap-1 px-3 py-1 bg-accent text-white text-xs font-semibold rounded-full">
										<Zap size={10} />
										Best value
									</span>
								</div>
							)}

							<h3 className="font-display text-xl font-semibold mb-1">
								{plan.name}
							</h3>

							<div className="mb-6">
								<span className="font-display text-4xl font-bold">
									{plan.price}
								</span>
								<span className="text-text-secondary text-sm">
									{plan.period}
								</span>
							</div>

							<ul className="space-y-3 mb-7">
								{plan.features.map((feature) => (
									<li
										key={feature}
										className="flex items-center gap-2.5 text-sm"
									>
										<Check
											size={14}
											className="text-accent flex-shrink-0"
										/>
										{feature}
									</li>
								))}
							</ul>

							<button
								onClick={() => handleCTA(plan.id)}
								disabled={
									plan.id === "pro_75" && isLoading
								}
								className={`w-full py-3 px-4 font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
									plan.popular
										? "bg-cta text-cta-foreground hover:bg-cta-hover"
										: "bg-surface-inset text-text-primary hover:bg-accent-muted"
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
					))}
				</div>
			</div>
		</section>
	);
};
