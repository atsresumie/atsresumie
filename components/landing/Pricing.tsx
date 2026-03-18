import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

export const Pricing = () => {
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
										<CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
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
							{/* Decorative ellipses */}
							<div className="absolute top-[201px] right-[-40px] w-[180px] h-[167px] bg-[#d54e21] rounded-full opacity-30 blur-xl" />
							<div className="absolute top-[230px] right-[10px] w-[180px] h-[167px] bg-[#9d2e09] rounded-full opacity-20 blur-xl" />

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
											<CheckCircle2 className="w-4 h-4 text-white flex-shrink-0" />
											<span className="text-sm text-white">
												{item}
											</span>
										</div>
									))}
								</div>
							</div>
							<Link
								href="/get-started"
								className="relative z-10 w-full h-10 bg-white text-accent text-base rounded-[5px] flex items-center justify-center hover:bg-white/90 transition-colors cursor-pointer"
							>
								Subscribe
							</Link>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
};
