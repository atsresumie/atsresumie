import { X, ArrowRight } from "lucide-react";

/**
 * BeforeAfter — Server Component
 *
 * Static side-by-side comparison. Visual does the talking.
 */

const beforeBullets = [
	"Managed various projects and contributed to team goals",
	"Worked with databases and backend systems",
	"Helped develop software solutions for internal use",
];

const afterBullets = [
	"Led migration of 3 legacy services to AWS, reducing deploy time 40%",
	"Optimized PostgreSQL queries for 2M+ records/day, -60% latency",
	"Built CI/CD pipeline adopted by 4 engineering teams",
];

export const BeforeAfter = () => {
	return (
		<section className="py-20 md:py-28 bg-surface-inset/30">
			<div className="container mx-auto px-4">
				<h2 className="font-display text-2xl md:text-3xl font-semibold text-center mb-14">
					The difference
				</h2>

				<div className="grid md:grid-cols-2 gap-5 max-w-3xl mx-auto">
					{/* Before */}
					<div className="rounded-xl bg-surface-raised border border-border-visible p-6">
						<div className="flex items-center gap-2 mb-5">
							<div className="w-7 h-7 rounded-full bg-error-muted flex items-center justify-center">
								<X size={14} className="text-error" />
							</div>
							<span className="text-sm font-medium text-text-primary">
								Generic resume
							</span>
						</div>
						<ul className="space-y-3">
							{beforeBullets.map((bullet, i) => (
								<li
									key={i}
									className="flex items-start gap-2.5 text-sm text-text-tertiary"
								>
									<span className="w-1 h-1 rounded-full bg-error/50 mt-2 flex-shrink-0" />
									{bullet}
								</li>
							))}
						</ul>
					</div>

					{/* After */}
					<div className="rounded-xl bg-surface-raised border border-accent/20 p-6">
						<div className="flex items-center gap-2 mb-5">
							<div className="w-7 h-7 rounded-full bg-accent-muted flex items-center justify-center">
								<ArrowRight
									size={14}
									className="text-accent"
								/>
							</div>
							<span className="text-sm font-medium text-text-primary">
								Tailored for the role
							</span>
						</div>
						<ul className="space-y-3">
							{afterBullets.map((bullet, i) => (
								<li
									key={i}
									className="flex items-start gap-2.5 text-sm text-text-primary"
								>
									<ArrowRight
										size={12}
										className="text-accent mt-0.5 flex-shrink-0"
									/>
									{bullet}
								</li>
							))}
						</ul>
					</div>
				</div>
			</div>
		</section>
	);
};
