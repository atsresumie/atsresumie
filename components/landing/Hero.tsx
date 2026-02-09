import { Sparkles, Download, TrendingUp, CheckCircle2 } from "lucide-react";
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
			<div className="relative z-10 container mx-auto px-4 py-20 md:py-32">
				<div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-center justify-center">
					{/* Left: Text Content */}
					<div className="text-center pt-8 lg:pt-16 max-w-xl">
						{/* Badge */}
						<div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full bg-muted/50 border border-border/50 text-sm text-muted-foreground animate-fade-in-up animation-delay-100">
							<Sparkles size={14} className="text-accent" />
							<span>3 free credits included</span>
						</div>

						{/* Headline */}
						<h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight mb-6 animate-fade-in-up animation-delay-200">
							ATS-optimized resumes,{" "}
							<span className="text-gradient">
								generated as LaTeX.
							</span>
						</h1>

						{/* Subheadline */}
						<p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-8 animate-fade-in-up animation-delay-300">
							Paste a job description + your resume. Get an
							ATS-friendly PDF and LaTeX source in minutes.
						</p>

						{/* CTAs */}
						<div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 animate-fade-in-up animation-delay-400">
							<Link
								href="/get-started"
								className="w-full sm:w-auto"
							>
								<button className="w-full sm:w-auto px-8 py-4 bg-accent text-accent-foreground font-semibold rounded-sm hover:bg-accent-hover transition-all hover:-translate-y-0.5 active:scale-[0.98]">
									Get Started
								</button>
							</Link>
							<a
								href="#how-it-works"
								className="w-full sm:w-auto px-8 py-4 text-foreground font-medium rounded-sm border border-border hover:bg-muted/50 transition-all hover:-translate-y-0.5"
							>
								See how it works
							</a>
						</div>
					</div>

					{/* Right: Preview Card */}
					<div className="relative w-[80vw] max-w-4xl mt-12 lg:mt-16 animate-fade-in-up animation-delay-500">
						<div className="bg-surface-raised rounded-sm border border-border-visible p-6">
							{/* ATS Score Ring */}
							<div className="flex items-center gap-6 mb-6">
								<div className="relative w-20 h-20">
									<svg
										className="w-20 h-20 -rotate-90"
										viewBox="0 0 80 80"
									>
										<circle
											cx="40"
											cy="40"
											r="35"
											fill="none"
											stroke="hsl(var(--muted))"
											strokeWidth="6"
										/>
										<circle
											cx="40"
											cy="40"
											r="35"
											fill="none"
											stroke="var(--accent)"
											strokeWidth="6"
											strokeLinecap="round"
											strokeDasharray="220"
											strokeDashoffset="44"
											className="animate-progress-fill"
										/>
									</svg>
									<div className="absolute inset-0 flex items-center justify-center">
										<span className="font-display text-2xl font-semibold text-foreground animate-fade-in animation-delay-800">
											80%
										</span>
									</div>
								</div>
								<div>
									<h3 className="font-display text-lg font-medium text-foreground mb-1">
										ATS Score
									</h3>
									<p className="text-sm text-muted-foreground">
										Optimized for tracking systems
									</p>
								</div>
							</div>

							{/* Keyword Match Bars */}
							<div className="space-y-3 mb-6">
								{[
									{
										label: "Keyword Match",
										value: 85,
										delay: "600",
									},
									{
										label: "Format Score",
										value: 92,
										delay: "700",
									},
									{
										label: "Section Structure",
										value: 78,
										delay: "800",
									},
								].map((item) => (
									<div key={item.label}>
										<div className="flex justify-between text-sm mb-1">
											<span className="text-muted-foreground">
												{item.label}
											</span>
											<span className="text-foreground font-medium">
												{item.value}%
											</span>
										</div>
										<div className="h-2 bg-muted rounded-full overflow-hidden">
											<div
												className={`h-full rounded-full bg-accent animate-bar-fill animation-delay-${item.delay}`}
												style={{
													width: `${item.value}%`,
												}}
											/>
										</div>
									</div>
								))}
							</div>

							{/* Improvements */}
							<div className="border-t border-border/50 pt-4 mb-6">
								<h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
									<TrendingUp
										size={14}
										className="text-accent"
									/>
									Improvements Applied
								</h4>
								<div className="space-y-2">
									{[
										"Action verbs optimized",
										"Skills section enhanced",
										"ATS-safe formatting",
									].map((item, i) => (
										<div
											key={item}
											className={`flex items-center gap-2 text-sm text-muted-foreground animate-fade-in-left animation-delay-${900 + i * 100}`}
										>
											<CheckCircle2
												size={14}
												className="text-accent"
											/>
											{item}
										</div>
									))}
								</div>
							</div>

							{/* Download Button (Demo) */}
							<button
								disabled
								className="w-full py-3 px-4 bg-muted/50 text-muted-foreground font-medium rounded-sm flex items-center justify-center gap-2 cursor-not-allowed opacity-60"
							>
								<Download size={18} />
								Download PDF (1 credit)
							</button>
						</div>

						{/* Floating decoration */}
						<div className="absolute -top-4 -right-4 w-24 h-24 rounded-sm bg-surface-raised border border-border/30 hidden lg:flex items-center justify-center animate-float">
							<span className="font-display text-3xl">📄</span>
						</div>
					</div>
				</div>
			</div>

			{/* Scroll indicator */}
			<div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-fade-in animation-delay-1000">
				<div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex justify-center pt-2 animate-bounce-slow">
					<div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
				</div>
			</div>
		</section>
	);
};
