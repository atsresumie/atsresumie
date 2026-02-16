import { Upload, ClipboardPaste, Download, ArrowRight } from "lucide-react";

/**
 * HowItWorks Component - Server Component (no framer-motion)
 */

const steps = [
	{
		number: "01",
		icon: Upload,
		title: "Upload your resume",
		description:
			"Upload your current resume as PDF or DOCX — we'll parse it automatically.",
	},
	{
		number: "02",
		icon: ClipboardPaste,
		title: "Paste the job description",
		description:
			"Paste the job posting you're targeting. We'll identify the key requirements and skills.",
	},
	{
		number: "03",
		icon: Download,
		title: "Generate → review → download",
		description:
			"Get a tailored, ATS-ready resume. Review the changes, then download your PDF.",
	},
];

export const HowItWorks = () => {
	return (
		<section
			id="how-it-works"
			className="relative py-24 md:py-32 overflow-hidden"
		>
			{/* Background gradient */}
			<div className="absolute inset-0 bg-gradient-to-b from-surface-base via-surface-raised/20 to-surface-base" />

			<div className="container mx-auto relative z-10">
				{/* Section header */}
				<div className="text-center mb-16 md:mb-20 animate-fade-in-up">
					<h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold mb-4">
						How it works
					</h2>
					<p className="text-lg text-text-secondary max-w-2xl mx-auto">
						Three simple steps to an ATS-optimized resume
					</p>
				</div>

				{/* Steps */}
				<div className="relative">
					{/* Progress line */}
					<div className="absolute top-1/2 left-0 right-0 h-px bg-border-subtle hidden lg:block" />
					<div
						className="absolute top-1/2 left-0 right-0 h-px hidden lg:block animate-progress-line"
						style={{
							background: "var(--accent)",
						}}
					/>

					<div className="grid md:grid-cols-3 gap-8 lg:gap-12">
						{steps.map((step, index) => {
							const Icon = step.icon;
							return (
								<div
									key={step.number}
									className={`relative group animate-fade-in-up animation-delay-${(index + 2) * 100}`}
								>
									{/* Card */}
									<div className="relative bg-surface-raised rounded-sm border border-border-visible p-8 h-full transition-all duration-300 hover:border-accent/30 hover:shadow-lg">
										{/* Step number */}
										<div className="absolute -top-4 left-8 px-3 py-1 bg-surface-base border border-border-visible rounded-sm">
											<span className="font-display text-sm font-semibold text-accent">
												{step.number}
											</span>
										</div>

										{/* Icon */}
										<div className="w-14 h-14 rounded-sm bg-surface-inset flex items-center justify-center mb-6 mt-2 transition-transform duration-300 group-hover:scale-105">
											<Icon
												size={24}
												className="text-accent"
											/>
										</div>

										{/* Content */}
										<h3 className="font-display text-xl font-medium mb-3 text-text-primary">
											{step.title}
										</h3>
										<p className="text-text-secondary">
											{step.description}
										</p>

										{/* Arrow (hidden on last) */}
										{index < steps.length - 1 && (
											<div className="absolute -right-6 top-1/2 -translate-y-1/2 hidden lg:block z-10">
												<ArrowRight
													size={20}
													className="text-accent animate-pulse"
												/>
											</div>
										)}
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
