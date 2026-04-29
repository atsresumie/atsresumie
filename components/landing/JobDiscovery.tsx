import { Sparkles } from "lucide-react";

/**
 * JobDiscovery — Server Component
 *
 * Ranked job list preview with match scores. Tagged "Planned".
 * Honest positioning as future smart matching.
 */

const jobs = [
	{
		title: "Senior Frontend Engineer",
		company: "Stripe",
		match: 94,
		tags: ["Remote", "Full-time", "Top match"],
	},
	{
		title: "Full Stack Developer",
		company: "Linear",
		match: 87,
		tags: ["Hybrid", "Full-time"],
	},
	{
		title: "Product Engineer",
		company: "Vercel",
		match: 79,
		tags: ["Remote", "Full-time"],
	},
];

export const JobDiscovery = () => {
	return (
		<div className="rounded-xl bg-surface-raised border border-border-visible p-6 md:p-8 h-full">
			{/* Header */}
			<div className="flex items-center gap-3 mb-6">
				<h3 className="font-display text-lg md:text-xl font-semibold text-text-primary">
					Find better-fit jobs
				</h3>
				<span className="inline-flex items-center px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-accent-muted text-accent border border-accent/15">
					Planned
				</span>
			</div>

			{/* Recommended header */}
			<div className="flex items-center gap-1.5 mb-4">
				<Sparkles size={12} className="text-accent" />
				<span className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
					Recommended for you
				</span>
			</div>

			{/* Job list */}
			<div className="space-y-3">
				{jobs.map((job) => (
					<div
						key={`${job.company}-${job.title}`}
						className="rounded-lg bg-surface-inset/40 border border-border-subtle/50 p-3.5"
					>
						<div className="flex items-start justify-between gap-3 mb-2">
							<div className="min-w-0">
								<p className="text-sm font-medium text-text-primary truncate">
									{job.title}
								</p>
								<p className="text-xs text-text-secondary">
									{job.company}
								</p>
							</div>
							{/* Match percentage */}
							<div className="flex-shrink-0 text-right">
								<span className="text-sm font-bold text-accent">
									{job.match}%
								</span>
								<p className="text-[9px] text-text-tertiary">
									match
								</p>
							</div>
						</div>

						{/* Match bar */}
						<div className="w-full h-1.5 rounded-full bg-border-subtle/50 mb-2">
							<div
								className="h-full rounded-full bg-accent/70"
								style={{ width: `${job.match}%` }}
							/>
						</div>

						{/* Tags */}
						<div className="flex flex-wrap gap-1">
							{job.tags.map((tag) => (
								<span
									key={tag}
									className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
										tag === "Top match"
											? "bg-accent-muted text-accent"
											: "bg-surface-inset text-text-tertiary"
									}`}
								>
									{tag}
								</span>
							))}
						</div>
					</div>
				))}
			</div>

			<p className="text-[11px] text-text-tertiary mt-4">
				Ranked by resume match · Real-time JD parsing
			</p>
		</div>
	);
};
