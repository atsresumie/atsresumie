"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { toast } from "sonner";

const PACK_ID = "pro_75";

export const Pricing = () => {
	const { isAuthenticated, isLoading: authLoading } = useAuth();
	const { openAuthModal } = useAuthModal();
	const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);

	const handleSubscribe = async () => {
		if (isCheckoutLoading) return;

		if (!isAuthenticated) {
			if (typeof window !== "undefined") {
				const now = Date.now();
				localStorage.setItem(
					"auth_intent",
					JSON.stringify({
						id: crypto.randomUUID(),
						type: "buy_credits",
						payload: { packId: PACK_ID },
						createdAt: now,
						expiresAt: now + 15 * 60 * 1000,
						version: 1,
					}),
				);
			}
			openAuthModal("signup");
			return;
		}

		setIsCheckoutLoading(true);
		try {
			const res = await fetch("/api/stripe/checkout", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ packId: PACK_ID }),
			});

			const data = await res.json();

			if (!res.ok || !data.url) {
				throw new Error(data.error || "Failed to create checkout session");
			}

			window.location.href = data.url;
		} catch (error) {
			console.error("Checkout error:", error);
			toast.error(
				error instanceof Error ? error.message : "Failed to start checkout",
			);
			setIsCheckoutLoading(false);
		}
	};

	return (
		<section id="pricing" className="bg-surface-inset py-[60px] px-4 md:px-[116px]">
			<div className="max-w-[1208px] mx-auto flex flex-col items-center gap-10">
				<h2 className="font-display text-[28px] md:text-[36px] font-bold text-text-primary text-center">
					Simple pricing
				</h2>

				<div className="flex flex-col md:flex-row gap-10 items-start justify-center">
					{/* Free Plan */}
					<div className="bg-white border border-border-visible rounded-[5px] p-5 w-full md:w-[268px] flex flex-col gap-[100px]">
						<div className="flex flex-col gap-5">
							<span className="text-base text-black">Free</span>
							<div className="flex items-end gap-1">
								<span className="text-[32px] font-normal text-black">
									$0
								</span>
								<span className="text-base text-text-secondary">
									/ month
								</span>
							</div>
							<div className="h-px bg-[#d9d9d9]" />
							<div className="flex flex-col gap-2">
								<span className="text-base text-black">
									What&apos;s included?
								</span>
								{[
									"3 credits on signup",
									"PDF download included",
									"Export is always free",
								].map((item) => (
									<div
										key={item}
										className="flex items-center gap-2"
									>
										<CheckCircle2 className="w-4 h-4 text-success shrink-0" />
										<span className="text-sm text-[#464646]">
											{item}
										</span>
									</div>
								))}
							</div>
						</div>
						<Link
							href="/get-started"
							className="w-full h-10 bg-[var(--primary-brown)] text-white text-base rounded-[5px] flex items-center justify-center hover:opacity-90 transition-opacity cursor-pointer"
						>
							Start Free
						</Link>
					</div>

					{/* Pro Plan */}
					<div className="relative rounded-[5px] overflow-hidden w-full md:w-[262px]">
						<div className="bg-gradient-to-b from-[#d54e21] to-[#9d2e09] p-5 flex flex-col gap-[100px]">
						{/* Decorative ellipses — 4 rotated/skewed shapes per Figma */}
						{[
							{ left: 142.79, top: 201 },
							{ left: 102, top: 229.76 },
							{ left: 143.06, top: 260.57 },
							{ left: 102.28, top: 289.33 },
						].map((pos, i) => (
							<div
								key={i}
								className="absolute flex items-center justify-center w-[179px] h-[167px] pointer-events-none"
								style={{ left: `${pos.left}px`, top: `${pos.top}px` }}
							>
								<div
									className="w-[122px] h-[125px] rounded-full bg-white/10"
									style={{ transform: "rotate(50.91deg) skewX(-3.9deg)" }}
								/>
							</div>
						))}

							<div className="relative z-10 flex flex-col gap-5">
								<div className="flex items-center justify-between">
									<span className="text-base text-white">
										Pro
									</span>
									<span className="bg-white/10 border border-white/50 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
										Best Value
									</span>
								</div>
								<div className="flex items-end gap-1">
									<span className="text-[32px] font-normal text-white">
										$10
									</span>
									<span className="text-base text-white">
										/ month
									</span>
								</div>
								<div className="h-px bg-[#d9d9d9] opacity-30" />
								<div className="flex flex-col gap-2">
									<span className="text-base text-white">
										What&apos;s included?
									</span>
									{[
										"50 credits per month",
										"Unlimited PDF exports",
										"Cancel anytime",
									].map((item) => (
										<div
											key={item}
											className="flex items-center gap-2"
										>
											<CheckCircle2 className="w-4 h-4 text-white shrink-0" />
											<span className="text-sm text-white">
												{item}
											</span>
										</div>
									))}
								</div>
							</div>
							<button
								onClick={handleSubscribe}
								disabled={isCheckoutLoading || authLoading}
								className="relative z-10 w-full h-10 bg-white text-accent text-base rounded-[5px] flex items-center justify-center hover:bg-white/90 transition-colors cursor-pointer disabled:opacity-70"
							>
								{isCheckoutLoading ? (
									<>
										<Loader2 className="w-4 h-4 mr-2 animate-spin" />
										Processing...
									</>
								) : (
									"Subscribe"
								)}
							</button>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
};
