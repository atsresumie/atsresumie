import { X, CheckCircle2 } from "lucide-react";

const problems = [
	"May fabricate roles and skills",
	"Inconsistent, ATS-breaking formatting",
	"No job description keyword analysis",
	"No application tracking",
	"No job listings to browse",
	"No PDF export optimized for ATS",
	"Generic bullets that get ignored",
];

const solutions = [
	"100% grounded in your real experience",
	"ATS-guaranteed clean formatting",
	"Deep JD keyword extraction & injection",
	"Full kanban application tracker",
	"Live job board with 2,400+ listings",
	"One-click tailored PDF export",
	"Role-specific bullets that convert",
];

export const Problem = () => {
	return (
		<section className="py-[60px] px-4 md:px-[116px]">
			<div className="max-w-[1208px] mx-auto flex flex-col items-center gap-10">
				{/* Header */}
				<div className="text-center flex flex-col gap-5 w-full">
					<h2 className="font-display text-[28px] md:text-[36px] font-bold text-text-primary">
						Why Generic AI Prompts Don&apos;t Work
					</h2>
					<p className="text-text-secondary text-base">
						Most people paste their resume into ChatGPT and hope for
						the best. Here&apos;s why that fails.
					</p>
				</div>

				{/* Cards */}
				<div className="flex flex-col md:flex-row gap-10 justify-center">
					{/* The Problem */}
					<div className="bg-white rounded-xl shadow-[var(--shadow-card)] w-full md:w-[377px] pb-5">
						<div className="bg-[var(--primary-brown-bg)] rounded-t-[5px] py-2.5 text-center">
							<span className="text-white font-semibold text-lg">
								The Problem
							</span>
						</div>
						<div className="px-5 pt-5 flex flex-col gap-3">
							{problems.map((item, i) => (
								<div
									key={i}
									className="flex items-center gap-2"
								>
									<X className="w-4 h-4 text-text-tertiary flex-shrink-0" />
									<span className="text-sm text-[#464646]">
										{item}
									</span>
								</div>
							))}
						</div>
					</div>

					{/* The Solution */}
					<div className="bg-white rounded-xl shadow-[var(--shadow-card)] w-full md:w-[377px] pb-5">
						<div className="bg-[var(--primary-brown-bg)] rounded-t-[5px] py-2.5 text-center">
							<span className="text-white font-semibold text-lg">
								The Solution
							</span>
						</div>
						<div className="px-5 pt-5 flex flex-col gap-3">
							{solutions.map((item, i) => (
								<div
									key={i}
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
				</div>
			</div>
		</section>
	);
};
