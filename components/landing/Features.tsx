const features = [
	{
		title: "Job-specific tailoring",
		description: "Aligned to the JD, grounded in your experience",
		number: "1",
		comingSoon: false,
	},
	{
		title: "ATS-friendly formatting",
		description: "Clean structure that passes screening",
		number: "2",
		comingSoon: false,
	},
	{
		title: "Multiple versions",
		description: "One resume per application",
		number: "3",
		comingSoon: false,
	},
	{
		title: "Fast iterations",
		description: "Compare results, iterate quickly",
		number: "4",
		comingSoon: false,
	},
	{
		title: "See ATS fit",
		description: "Quick signals on resume-to-job fit",
		number: "5",
		comingSoon: true,
	},
	{
		title: "Track applications",
		description: "One board for your job search",
		number: "6",
		comingSoon: true,
	},
];

export const Features = () => {
	return (
		<section className="py-[60px] px-4 md:px-[116px]">
			<div className="max-w-[1208px] mx-auto flex flex-col items-center gap-10">
				<h2 className="font-display text-[28px] md:text-[36px] font-bold text-text-primary text-center">
					Why ATSResumie
				</h2>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-20 w-full">
					{features.map((feature) => (
						<div
							key={feature.number}
							className="border-t border-border-visible pt-5 flex flex-col gap-3"
						>
							<div className="flex items-center justify-between">
								<div className="flex items-center gap-3">
									<span className="font-semibold text-lg text-text-primary">
										{feature.title}
									</span>
									{feature.comingSoon && (
										<span className="border border-accent text-accent text-xs font-semibold px-2 py-0.5 rounded-full bg-accent-muted">
											Coming Soon
										</span>
									)}
								</div>
								<div className="bg-[var(--primary-brown-light)] px-1.5 py-1 flex items-center justify-center">
									<span className="text-sm font-semibold text-[var(--primary-brown-dark)]">
										{feature.number}
									</span>
								</div>
							</div>
							<p className="text-sm text-text-secondary">
								{feature.description}
							</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
};
