import { Check, AlertTriangle } from "lucide-react";

/**
 * ATSScore — Server Component
 *
 * ATS fit scoring preview. Circular score ring + keyword chips + section checks.
 * Tagged "In development". Framed as guidance, not guaranteed accuracy.
 */

const keywordChips = [
	{ label: "React", match: true },
	{ label: "TypeScript", match: true },
	{ label: "CI/CD", match: true },
	{ label: "AWS", match: false },
	{ label: "GraphQL", match: false },
];

const sectionChecks = [
	{ label: "Contact info", pass: true },
	{ label: "Work experience", pass: true },
	{ label: "Skills match", pass: true },
	{ label: "Keywords coverage", pass: false },
];

export const ATSScore = () => {
	return (
		<div className="rounded-xl bg-surface-raised border border-border-visible p-6 md:p-8 h-full">
			{/* Header */}
			<div className="flex items-center gap-3 mb-6">
				<h3 className="font-display text-lg md:text-xl font-semibold text-text-primary">
					See your ATS fit
				</h3>
				<span className="inline-flex items-center px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-accent-muted text-accent border border-accent/15">
					In development
				</span>
			</div>

			<div className="flex flex-col sm:flex-row gap-6">
				{/* Score ring */}
				<div className="flex flex-col items-center flex-shrink-0">
					<div className="relative w-24 h-24">
						<svg
							className="w-24 h-24 -rotate-90"
							viewBox="0 0 80 80"
						>
							<circle
								cx="40"
								cy="40"
								r="35"
								fill="none"
								stroke="var(--border-subtle)"
								strokeWidth="5"
							/>
							<circle
								cx="40"
								cy="40"
								r="35"
								fill="none"
								stroke="var(--accent)"
								strokeWidth="5"
								strokeDasharray="220"
								strokeDashoffset="44"
								strokeLinecap="round"
								className="animate-progress-fill"
							/>
						</svg>
						<div className="absolute inset-0 flex flex-col items-center justify-center">
							<span className="font-display text-2xl font-bold text-text-primary">
								82%
							</span>
							<span className="text-[10px] text-text-tertiary font-medium">
								ATS fit
							</span>
						</div>
					</div>
					<p className="text-[11px] text-text-tertiary mt-2 text-center max-w-[120px]">
						Actionable fit guidance
					</p>
				</div>

				{/* Details */}
				<div className="flex-1 space-y-5">
					{/* Keyword matches */}
					<div>
						<p className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary mb-2">
							Keyword match
						</p>
						<div className="flex flex-wrap gap-1.5">
							{keywordChips.map((chip) => (
								<span
									key={chip.label}
									className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${
										chip.match
											? "bg-success-muted text-success"
											: "bg-warning-muted text-warning"
									}`}
								>
									{chip.match ? (
										<Check size={9} />
									) : (
										<AlertTriangle size={9} />
									)}
									{chip.label}
								</span>
							))}
						</div>
					</div>

					{/* Section checks */}
					<div>
						<p className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary mb-2">
							Section checks
						</p>
						<div className="space-y-1.5">
							{sectionChecks.map((item) => (
								<div
									key={item.label}
									className="flex items-center gap-2"
								>
									{item.pass ? (
										<Check
											size={12}
											className="text-success flex-shrink-0"
										/>
									) : (
										<AlertTriangle
											size={12}
											className="text-warning flex-shrink-0"
										/>
									)}
									<span className="text-xs text-text-secondary">
										{item.label}
									</span>
									<span
										className={`ml-auto text-[10px] font-medium ${
											item.pass
												? "text-success"
												: "text-warning"
										}`}
									>
										{item.pass ? "Pass" : "Improve"}
									</span>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>

			<p className="text-[11px] text-text-tertiary mt-5">
				Spot gaps before you apply — quick signals, not guaranteed scores.
			</p>
		</div>
	);
};
