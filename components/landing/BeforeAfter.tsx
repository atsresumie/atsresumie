import { X, Check, Sparkles } from "lucide-react";

/**
 * BeforeAfter — Server Component
 *
 * Full-width comparison: Generic AI vs ATSResumie.
 * Wide cards, VS badge, checkmarks vs crosses. Light theme.
 */

const genericBullets = [
	"May fabricate roles and skills",
	"Inconsistent, ATS-breaking formatting",
	"No job description keyword analysis",
	"No application tracking",
	"No job listings to browse",
	"No PDF export optimized for ATS",
	"Generic bullets that get ignored",
];

const atsrBullets = [
	"100% grounded in your real experience",
	"ATS-guaranteed clean formatting",
	"Deep JD keyword extraction & injection",
	"Full kanban application tracker",
	"Live job board with 2,400+ listings",
	"One-click tailored PDF export",
	"Role-specific bullets that convert",
];

export const BeforeAfter = () => {
	return (
		<section className="py-20 md:py-28 bg-surface-inset/30">
			<div className="container mx-auto px-4">
				<h2 className="font-display text-2xl md:text-3xl font-semibold text-center mb-14 text-text-primary">
					We Built, What LLM&apos;s Can&apos;t
				</h2>

				{/* Cards wrapper with VS in between */}
				<div className="relative max-w-5xl mx-auto flex flex-col md:flex-row items-stretch gap-5 md:gap-0">
					{/* Generic AI card */}
					<div className="flex-1 rounded-xl bg-surface-raised border border-border-visible p-8 md:p-10 md:mr-6">
						<p className="text-[11px] font-bold uppercase tracking-[0.15em] text-text-tertiary mb-7">
							Generic AI (ChatGPT / Gemini)
						</p>
						<ul className="space-y-4">
							{genericBullets.map((bullet, i) => (
								<li
									key={i}
									className="flex items-start gap-3 text-[15px] text-text-tertiary"
								>
									<X
										size={16}
										className="text-error mt-0.5 flex-shrink-0"
									/>
									{bullet}
								</li>
							))}
						</ul>
					</div>

					{/* VS badge — centered between cards */}
					<div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
						<div className="w-12 h-12 rounded-full bg-surface-base border-2 border-border-visible flex items-center justify-center shadow-md">
							<span className="text-sm font-bold text-text-secondary tracking-wide">
								VS
							</span>
						</div>
					</div>

					{/* Mobile VS */}
					<div className="flex md:hidden items-center justify-center -my-1">
						<div className="w-10 h-10 rounded-full bg-surface-base border-2 border-border-visible flex items-center justify-center shadow-md">
							<span className="text-xs font-bold text-text-secondary">
								VS
							</span>
						</div>
					</div>

					{/* ATSResumie card */}
					<div className="flex-1 rounded-xl bg-surface-raised border border-accent/20 p-8 md:p-10 md:ml-6">
						<p className="text-[11px] font-bold uppercase tracking-[0.15em] text-accent mb-7 flex items-center gap-1.5">
							<Sparkles size={12} className="text-accent" />
							ATSResumie
						</p>
						<ul className="space-y-4">
							{atsrBullets.map((bullet, i) => (
								<li
									key={i}
									className="flex items-start gap-3 text-[15px] text-text-primary"
								>
									<Check
										size={16}
										className="text-success mt-0.5 flex-shrink-0"
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
