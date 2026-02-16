import { Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";

/**
 * Hero Component - Server Component (no framer-motion)
 *
 * Uses CSS animations for performance. No client-side JavaScript required.
 */
export const Hero = () => {
	return (
		<section
			id="start"
			className="relative min-h-screen flex items-center justify-center overflow-hidden"
		>
			{/* Background gradient */}
			<div className="absolute inset-0 bg-gradient-to-b from-surface-base via-surface-base to-surface-raised" />

			{/* Animated gradient orbs - CSS only */}
			<div
				className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20 animate-float-slow"
				style={{
					background:
						"radial-gradient(circle, hsl(36, 30%, 70%) 0%, transparent 70%)",
					filter: "blur(80px)",
				}}
			/>
			<div
				className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full opacity-15 animate-float-reverse"
				style={{
					background:
						"radial-gradient(circle, hsl(32, 28%, 66%) 0%, transparent 70%)",
					filter: "blur(60px)",
				}}
			/>

			{/* Content */}
			<div className="relative z-10 container mx-auto px-4 py-12 md:py-16">
				<div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-center lg:items-center justify-center">
					{/* Left: Text Content */}
					<div className="text-center mt-10 lg:text-left pt-8 lg:pt-12 max-w-xl">
						{/* Badge */}
						<div className="inline-flex items-center gap-2 px-4 py-1.5 mb-4 rounded-full bg-muted/50 border border-border/50 text-sm text-muted-foreground animate-fade-in-up animation-delay-100">
							<Sparkles size={14} className="text-accent" />
							<span>3 free credits included</span>
						</div>

						{/* Headline */}
						<h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight mb-4 animate-fade-in-up animation-delay-200">
							Your resume, tailored to the job —{" "}
							<span className="text-gradient">ATS-ready.</span>
						</h1>

						{/* Subheadline */}
						<p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-6 animate-fade-in-up animation-delay-300">
							Upload your resume and paste the job description.
							ATSResumie rewrites your bullets to match the role —
							without inventing experience.
						</p>

						{/* CTAs */}
						<div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 animate-fade-in-up animation-delay-400">
							<Link
								href="/get-started"
								className="w-full sm:w-auto"
							>
								<button className="w-full sm:w-auto px-8 py-4 bg-accent text-accent-foreground font-semibold rounded-sm hover:bg-accent-hover transition-all hover:-translate-y-0.5 active:scale-[0.98]">
									Tailor my resume
								</button>
							</Link>
							<a
								href="#how-it-works"
								className="w-full sm:w-auto px-8 py-4 text-foreground font-medium rounded-sm border border-border hover:bg-muted/50 transition-all hover:-translate-y-0.5 text-center"
							>
								See how it works
							</a>
						</div>
					</div>

					{/* Right: Visual — ChatGPT-style conversation thread */}
					<div
						className="relative w-full max-w-lg mt-4 ml-10 lg:mt-4 animate-fade-in-up animation-delay-500"
						style={{ overflow: "visible" }}
					>
						{/* Chat window frame */}
						<div className="bg-surface-raised rounded-lg border border-border-visible overflow-hidden shadow-lg">
							{/* Chat header bar */}
							<div className="flex items-center justify-between px-4 py-2.5 border-b border-border-subtle bg-surface-inset/50">
								<div className="flex items-center gap-2">
									<div className="w-5 h-5 rounded-full bg-[hsl(160,60%,45%)] flex items-center justify-center">
										<span className="text-white text-[10px] font-bold">
											✦
										</span>
									</div>
									<span className="text-sm font-medium text-text-primary">
										ChatGPT
									</span>
									<span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-inset border border-border-subtle text-text-tertiary">
										4o
									</span>
								</div>
								<div className="flex gap-1.5">
									<div className="w-2.5 h-2.5 rounded-full bg-text-tertiary/30" />
									<div className="w-2.5 h-2.5 rounded-full bg-text-tertiary/30" />
									<div className="w-2.5 h-2.5 rounded-full bg-text-tertiary/30" />
								</div>
							</div>

							{/* Chat messages area */}
							<div className="px-4 py-5 space-y-5 overflow-hidden">
								{/* User message - right aligned */}
								<div className="flex items-start gap-2.5 justify-end animate-fade-in-up animation-delay-600">
									<div className="max-w-[85%]">
										<div className="bg-[hsl(30,8%,18%)] rounded-2xl rounded-br-sm px-4 py-3 text-sm text-text-primary leading-relaxed">
											Hey ChatGPT, here is my resume and
											the JD I&apos;m applying for. Can
											you rewrite my resume to be
											ATS-friendly and tailored to the
											role?
										</div>
									</div>
									<div className="w-7 h-7 rounded-full bg-accent/80 flex items-center justify-center flex-shrink-0 mt-0.5">
										<span className="text-white text-xs font-semibold">
											U
										</span>
									</div>
								</div>

								{/* ChatGPT response - left aligned */}
								<div className="flex items-start gap-2.5 animate-fade-in-up animation-delay-800">
									<div className="w-7 h-7 rounded-full bg-[hsl(160,60%,45%)] flex items-center justify-center flex-shrink-0 mt-0.5">
										<span className="text-white text-[10px] font-bold">
											✦
										</span>
									</div>
									<div className="max-w-[85%]">
										<div className="bg-surface-inset rounded-2xl rounded-bl-sm px-4 py-3 text-sm text-text-secondary leading-relaxed space-y-2">
											<p>
												Sure! Here&apos;s a tailored
												version:
											</p>
											<p className="text-text-tertiary italic">
												• &quot;Spearheaded a
												transformative digital strategy
												overhaul resulting in
												unprecedented operational
												synergies…&quot;
											</p>
											<p className="text-text-tertiary italic">
												• &quot;Orchestrated
												cross-functional stakeholder
												alignment driving 500% ROI
												across global markets…&quot;
											</p>
										</div>
										{/* Warning tags */}
										<div className="mt-2 flex flex-wrap gap-1.5">
											{[
												"Inconsistent results",
												"Invents experience",
												"Bad formatting",
											].map((tag) => (
												<span
													key={tag}
													className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-error/10 text-error/80"
												>
													<span className="w-1 h-1 rounded-full bg-error/60" />
													{tag}
												</span>
											))}
										</div>
									</div>
								</div>

								{/* ChatGPT suggestion reply */}
								<div className="flex items-start gap-2.5 animate-fade-in-up animation-delay-1000">
									<div className="w-7 h-7 rounded-full bg-[hsl(160,60%,45%)] flex items-center justify-center flex-shrink-0 mt-0.5">
										<span className="text-white text-[10px] font-bold">
											✦
										</span>
									</div>
									<div className="max-w-[85%]">
										<div className="bg-accent/8 border border-accent/20 rounded-2xl rounded-bl-sm px-4 py-3 text-sm leading-relaxed">
											<p className="text-text-secondary">
												For more{" "}
												<span className="text-accent font-medium">
													accurate, job-aligned
												</span>{" "}
												results without hallucination,
												try{" "}
												<span className="text-accent font-semibold">
													ATSResumie
												</span>{" "}
												→
											</p>
										</div>
									</div>
								</div>
							</div>

							{/* Fake input bar at the bottom */}
							<div className="px-4 py-3 border-t border-border-subtle bg-surface-inset/30">
								<div className="flex items-center gap-2 bg-surface-inset rounded-xl px-4 py-2.5 border border-border-subtle">
									<span className="text-sm text-text-tertiary flex-1">
										Message ChatGPT…
									</span>
									<div className="w-7 h-7 rounded-lg bg-text-tertiary/20 flex items-center justify-center">
										<ArrowRight
											size={14}
											className="text-text-tertiary -rotate-90"
										/>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Scroll indicator */}
			<div className="absolute bottom-18 left-1/2 -translate-x-1/2 animate-fade-in animation-delay-1000">
				<div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex justify-center pt-2 animate-bounce-slow">
					<div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
				</div>
			</div>
		</section>
	);
};
