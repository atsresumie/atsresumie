import { Sparkles, ArrowRight, MessageSquare, FileCheck } from "lucide-react";
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
					<div className="text-center lg:text-left pt-8 lg:pt-16 max-w-xl">
						{/* Badge */}
						<div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full bg-muted/50 border border-border/50 text-sm text-muted-foreground animate-fade-in-up animation-delay-100">
							<Sparkles size={14} className="text-accent" />
							<span>3 free credits included</span>
						</div>

						{/* Headline */}
						<h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight mb-6 animate-fade-in-up animation-delay-200">
							Your resume, tailored to the job —{" "}
							<span className="text-gradient">ATS-ready.</span>
						</h1>

						{/* Subheadline */}
						<p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-8 animate-fade-in-up animation-delay-300">
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

					{/* Right: Visual — ChatGPT prompt vs ATSResumie output */}
					<div className="relative w-full max-w-lg mt-12 lg:mt-16 animate-fade-in-up animation-delay-500">
						<div className="grid gap-4">
							{/* Left card: Mock ChatGPT prompt */}
							<div className="bg-surface-raised rounded-sm border border-border-visible p-5 relative">
								<div className="flex items-center gap-2 mb-3">
									<div className="w-8 h-8 rounded-full bg-surface-inset flex items-center justify-center">
										<MessageSquare
											size={16}
											className="text-muted-foreground"
										/>
									</div>
									<span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
										The old way
									</span>
								</div>
								<div className="bg-surface-inset rounded-sm p-4 text-sm text-muted-foreground leading-relaxed font-mono">
									<p>
										&quot;Hey ChatGPT, here is my resume and
										the JD I&apos;m applying for. Can you
										rewrite my resume to be ATS-friendly and
										tailored…&quot;
									</p>
								</div>
								<div className="mt-3 flex flex-wrap gap-2">
									{[
										"Inconsistent results",
										"Invents experience",
										"Bad formatting",
									].map((tag) => (
										<span
											key={tag}
											className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-error/10 text-error/80"
										>
											<span className="w-1 h-1 rounded-full bg-error/60" />
											{tag}
										</span>
									))}
								</div>
							</div>

							{/* Right card: ATSResumie output */}
							<div className="bg-surface-raised rounded-sm border border-accent/30 p-5 relative shadow-lg">
								<div className="flex items-center gap-2 mb-3">
									<div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
										<FileCheck
											size={16}
											className="text-accent"
										/>
									</div>
									<span className="text-xs font-medium text-accent uppercase tracking-wide">
										The ATSResumie way
									</span>
								</div>
								<div className="space-y-2.5">
									{[
										"Led migration of 3 legacy services to cloud-native microservices, reducing deployment time by 40%",
										"Built real-time data pipeline processing 2M+ events/day using Kafka and Python",
										"Designed CI/CD workflow adopted by 4 teams, cutting release cycles from 2 weeks to 2 days",
									].map((bullet, i) => (
										<div
											key={i}
											className={`flex items-start gap-2 text-sm text-text-primary animate-fade-in-left animation-delay-${700 + i * 100}`}
										>
											<ArrowRight
												size={14}
												className="text-accent mt-0.5 flex-shrink-0"
											/>
											<span>{bullet}</span>
										</div>
									))}
								</div>
								<div className="mt-3 flex flex-wrap gap-2">
									{[
										"Job-aligned",
										"Truthful",
										"ATS-ready",
									].map((tag) => (
										<span
											key={tag}
											className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-accent/10 text-accent"
										>
											<span className="w-1 h-1 rounded-full bg-accent" />
											{tag}
										</span>
									))}
								</div>
							</div>
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
