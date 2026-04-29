import {
	CircleAlert,
	CheckCircle2,
	Sparkles,
	CircleX,
	Check,
} from "lucide-react";

const beforeItems = [
	"Managed projects and contributed to team goals",
	"Worked with databases to improve performance",
	"Helped develop software solutions",
];

const afterItems = [
	"Led migration of 3 legacy services to AWS, reducing deployment time by 40%",
	"Optimized PostgreSQL queries processing 2M+ records/day, cutting latency 60%",
	"Built CI/CD pipeline with GitHub Actions adopted by 4 teams",
];

const matchedSkills = ["React", "TypeScript", "CI/CD"];
const missingSkills = ["AWS", "GraphQL"];

const checklistItems = [
	{ label: "Contact Info", status: "pass" as const },
	{ label: "Work experience", status: "pass" as const },
	{ label: "Skill match", status: "pass" as const },
	{ label: "Keyword coverage", status: "improve" as const },
];

export const BeforeAfter = () => {
	return (
		<section className="bg-surface-inset py-10 px-4 md:px-[116px]">
			<div className="flex flex-col lg:flex-row items-center justify-between gap-12 max-w-[1208px] mx-auto">
				{/* Left text */}
				<div className="flex flex-col gap-5 max-w-[476px]">
					<h2 className="font-display text-[28px] md:text-[36px] font-bold leading-tight text-text-primary">
						More than a resume generator
					</h2>
					<p className="text-text-secondary text-base">
						Paste a job description. Get a tailored, ATS-ready
						resume.
					</p>
				</div>

				{/* Right cards */}
				<div className="relative flex items-center w-full lg:w-auto">
					{/* Comparison card */}
					<div className="bg-white rounded-xl shadow-[var(--shadow-card)] w-[340px] md:w-[377px] flex-shrink-0 z-10 pb-5">
						<div className="bg-accent rounded-t-[5px] py-2.5 text-center">
							<span className="text-white font-semibold text-lg">
								Comparison
							</span>
						</div>
						<div className="px-5 pt-5 flex flex-col gap-5">
							{/* Before */}
							<div className="flex flex-col gap-3">
								<div className="flex items-center gap-2.5">
									<span className="text-text-tertiary text-sm">
										Before
									</span>
									<span className="bg-error-muted text-error text-xs px-1 py-0.5 rounded-[5px]">
										Generic
									</span>
								</div>
								{beforeItems.map((item, i) => (
									<div
										key={i}
										className="flex items-start gap-1"
									>
										<CircleAlert className="w-4 h-4 text-error flex-shrink-0 mt-0.5" />
										<span className="text-sm text-[#464646] line-through">
											{item}
										</span>
									</div>
								))}
							</div>

							<div className="h-px bg-[#d9d9d9]" />

							{/* After */}
							<div className="flex flex-col gap-3">
								<div className="flex items-center gap-2.5">
									<span className="text-text-tertiary text-sm">
										After
									</span>
									<span className="bg-success-muted text-success text-xs px-1 py-0.5 rounded-[5px] inline-flex items-center gap-1">
										<Sparkles className="w-3 h-3" />
										Tailored
									</span>
								</div>
								{afterItems.map((item, i) => (
									<div
										key={i}
										className="flex items-start gap-1"
									>
										<CheckCircle2 className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
										<span className="text-sm text-[#464646]">
											{item}
										</span>
									</div>
								))}
							</div>
						</div>
					</div>

					{/* ATS Fit card (overlapping) */}
					<div className="hidden md:flex flex-col bg-white rounded-xl shadow-[var(--shadow-card)] w-[442px] -ml-[130px] mt-16 z-20 pb-5">
						<div className="bg-accent rounded-t-[5px] flex items-center justify-between px-5 py-2.5">
							<span className="text-white font-semibold text-lg">
								See your ATS fit
							</span>
							<span className="border border-white text-white text-base font-semibold px-2 py-0.5 rounded-full">
								In Development
							</span>
						</div>
						<div className="px-5 pt-5 flex flex-col gap-5">
							{/* Score + Skills */}
							<div className="flex items-center gap-5">
								{/* ATS Ring */}
								<div className="relative w-[100px] h-[100px] flex-shrink-0">
									<svg
										viewBox="0 0 100 100"
										className="w-full h-full -rotate-90"
									>
										<circle
											cx="50"
											cy="50"
											r="42"
											fill="none"
											stroke="#fdf6ef"
											strokeWidth="8"
										/>
										<circle
											cx="50"
											cy="50"
											r="42"
											fill="none"
											stroke="#e4662b"
											strokeWidth="8"
											strokeDasharray={`${2 * Math.PI * 42 * 0.82} ${2 * Math.PI * 42 * 0.18}`}
											strokeLinecap="round"
										/>
									</svg>
									<div className="absolute inset-0 flex flex-col items-center justify-center">
										<span className="font-semibold text-lg text-black">
											82%
										</span>
										<span className="text-text-tertiary text-xs">
											ATS FIT
										</span>
									</div>
								</div>

								{/* Skills pills */}
								<div className="flex flex-col gap-2.5">
									<div className="flex flex-wrap gap-2.5">
										{matchedSkills.map((skill) => (
											<span
												key={skill}
												className="bg-[var(--primary-brown-light)] text-[var(--primary-brown)] text-sm px-2 py-0.5 rounded-[5px] inline-flex items-center gap-1"
											>
												<Check className="w-4 h-4" />
												{skill}
											</span>
										))}
									</div>
									<div className="flex flex-wrap gap-2.5">
										{missingSkills.map((skill) => (
											<span
												key={skill}
												className="bg-error-muted text-error text-sm px-2 py-0.5 rounded-[5px] inline-flex items-center gap-1"
											>
												<CircleAlert className="w-4 h-4" />
												{skill}
											</span>
										))}
									</div>
								</div>
							</div>

							<div className="h-px bg-[#d9d9d9]" />

							{/* Checklist */}
							<div className="flex flex-col gap-2.5">
								{checklistItems.map((item) => (
									<div
										key={item.label}
										className="flex items-center justify-between px-2 py-0.5 rounded-[5px]"
									>
										<div className="flex items-center gap-1">
											{item.status === "pass" ? (
												<CheckCircle2 className="w-4 h-4 text-success" />
											) : (
												<CircleAlert className="w-4 h-4 text-error" />
											)}
											<span className="text-sm text-[#464646]">
												{item.label}
											</span>
										</div>
										<span
											className={`text-sm ${item.status === "pass" ? "text-success" : "text-error"}`}
										>
											{item.status === "pass"
												? "Pass"
												: "Improve"}
										</span>
									</div>
								))}
							</div>
						</div>
						<p className="text-text-tertiary text-xs text-center px-5 mt-3">
							Spot gaps before you apply — quick signals, not
							guaranteed scores.
						</p>
					</div>
				</div>
			</div>
		</section>
	);
};
