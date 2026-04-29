import {
	Upload,
	Palette,
	Target,
	BarChart3,
	Search,
	KanbanSquare,
} from "lucide-react";

/**
 * PlatformPreview — Server Component
 *
 * "One connected workflow" — a visual step-flow showing the
 * full ATSResumie platform direction. Carries a "Platform preview" label.
 */

const workflowSteps = [
	{ icon: Upload, label: "Upload resume" },
	{ icon: Palette, label: "Pick template" },
	{ icon: Target, label: "Tailor for job" },
	{ icon: BarChart3, label: "See ATS score" },
	{ icon: Search, label: "View matched jobs" },
	{ icon: KanbanSquare, label: "Track applications" },
];

export const PlatformPreview = () => {
	return (
		<section id="platform-preview" className="py-20 md:py-28">
			<div className="container mx-auto px-4">
				{/* Section header */}
				<div className="text-center mb-14">
					<span className="inline-block px-3 py-1 mb-4 text-[11px] font-semibold uppercase tracking-wider rounded-full bg-accent-muted text-accent border border-accent/15">
						More than a resume generator
					</span>
					<h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary leading-tight">
						Your Entire Job Search. One Platform.
					</h2>
					<p className="text-sm text-text-secondary mt-3 max-w-md mx-auto">
						From upload to offer — everything in one place.
					</p>
				</div>

				{/* Workflow steps */}
				<div className="max-w-4xl mx-auto">
					<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-3">
						{workflowSteps.map((step, i) => {
							const Icon = step.icon;
							return (
								<div key={step.label} className="relative flex flex-col items-center">
									{/* Connector line (hidden for last item and on small screens) */}
									{i < workflowSteps.length - 1 && (
										<div className="hidden lg:block absolute top-6 left-[calc(50%+28px)] w-[calc(100%-56px)] border-t-2 border-dashed border-border-visible/60" />
									)}

									{/* Step card */}
									<div className="relative z-10 flex flex-col items-center text-center p-4 md:p-5 rounded-xl bg-surface-raised border border-border-visible w-full hover:border-accent/30 hover:shadow-card transition-all">
										{/* Step number */}
										<span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-surface-base border border-border-visible rounded-md text-[10px] font-semibold text-accent">
											{String(i + 1).padStart(2, "0")}
										</span>

										{/* Icon */}
										<div className="w-10 h-10 rounded-lg bg-accent-muted flex items-center justify-center mb-3 mt-1">
											<Icon size={20} className="text-accent" />
										</div>

										{/* Label */}
										<p className="text-xs font-medium text-text-primary leading-tight">
											{step.label}
										</p>
									</div>
								</div>
							);
						})}
					</div>
				</div>
			</div>
		</section>
	);
};
