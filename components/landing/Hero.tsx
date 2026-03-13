import { ArrowRight, Check, FileText, Sparkles } from "lucide-react";
import Link from "next/link";

/**
 * Hero Component — Server Component
 *
 * Visual-first, minimal text. Two-column layout:
 * Left = short headline + CTA, Right = before→after resume preview.
 */
export const Hero = () => {
	return (
		<section
			id="start"
			className="relative min-h-[90vh] flex items-center overflow-hidden"
		>
			{/* Subtle background gradient */}
			<div className="absolute inset-0 bg-gradient-to-br from-surface-base via-surface-base to-surface-inset/30" />

			<div className="relative z-10 container mx-auto px-4 pt-24 pb-16 md:pt-28 md:pb-20">
				<div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-center">
					{/* Left — Copy */}
					<div className="text-center lg:text-left max-w-lg">
						<h1 className="font-display text-4xl md:text-5xl lg:text-[3.5rem] font-semibold leading-[1.1] tracking-tight mb-5">
							Tailor your resume to{" "}
							<span className="text-accent">any job</span>
						</h1>

						<p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto lg:mx-0">
							Paste a job description. Get a tailored, ATS-ready
							resume.
						</p>

						{/* CTAs */}
						<div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 mb-8">
							<Link
								href="/get-started"
								className="w-full sm:w-auto px-8 py-3.5 bg-cta text-cta-foreground font-semibold rounded-lg hover:bg-cta-hover transition-all hover:-translate-y-0.5 active:scale-[0.98] text-center"
							>
								Start free
							</Link>
							<button
								onClick={undefined}
								className="w-full sm:w-auto px-6 py-3.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors inline-flex items-center justify-center gap-1.5"
							>
								See how it works
								<ArrowRight size={14} />
							</button>
						</div>

						{/* Micro-reassurance */}
						<div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-5 gap-y-2 text-sm text-muted-foreground">
							{[
								"ATS-friendly",
								"Your real experience",
								"Free to try",
							].map((item) => (
								<span
									key={item}
									className="inline-flex items-center gap-1.5"
								>
									<Check
										size={13}
										className="text-accent"
									/>
									{item}
								</span>
							))}
						</div>
					</div>

					{/* Right — Before / After resume preview card */}
					<div className="relative w-full max-w-md lg:max-w-lg">
						<div className="bg-surface-raised rounded-xl border border-border-visible shadow-card overflow-hidden">
							{/* Card header */}
							<div className="flex items-center gap-2 px-5 py-3 border-b border-border-subtle bg-surface-inset/50">
								<FileText
									size={15}
									className="text-accent"
								/>
								<span className="text-sm font-medium text-text-primary">
									Resume preview
								</span>
							</div>

							{/* Before section */}
							<div className="px-5 py-4 border-b border-border-subtle/60">
								<div className="flex items-center gap-2 mb-3">
									<span className="text-[11px] font-medium uppercase tracking-wide text-text-tertiary">
										Before
									</span>
									<span className="text-[10px] px-1.5 py-0.5 rounded bg-error-muted text-error font-medium">
										Generic
									</span>
								</div>
								<ul className="space-y-2">
									{[
										"Managed projects and contributed to team goals",
										"Worked with databases to improve performance",
										"Helped develop software solutions",
									].map((bullet, i) => (
										<li
											key={i}
											className="flex items-start gap-2 text-sm text-text-tertiary"
										>
											<span className="w-1 h-1 rounded-full bg-text-tertiary/50 mt-2 flex-shrink-0" />
											<span className="line-through decoration-text-tertiary/30">
												{bullet}
											</span>
										</li>
									))}
								</ul>
							</div>

							{/* After section */}
							<div className="px-5 py-4">
								<div className="flex items-center gap-2 mb-3">
									<span className="text-[11px] font-medium uppercase tracking-wide text-text-tertiary">
										After
									</span>
									<span className="text-[10px] px-1.5 py-0.5 rounded bg-success-muted text-success font-medium inline-flex items-center gap-1">
										<Sparkles size={9} />
										Tailored
									</span>
								</div>
								<ul className="space-y-2">
									{[
										"Led migration of 3 legacy services to AWS, reducing deployment time by 40%",
										"Optimized PostgreSQL queries processing 2M+ records/day, cutting latency 60%",
										"Built CI/CD pipeline with GitHub Actions adopted by 4 teams",
									].map((bullet, i) => (
										<li
											key={i}
											className="flex items-start gap-2 text-sm text-text-primary"
										>
											<ArrowRight
												size={12}
												className="text-accent mt-1 flex-shrink-0"
											/>
											{bullet}
										</li>
									))}
								</ul>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
};
