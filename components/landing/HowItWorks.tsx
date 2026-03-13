import { Upload, ClipboardPaste, Download } from "lucide-react";

/**
 * HowItWorks — Server Component
 *
 * 3 numbered steps, icon-driven, minimal text.
 */

const steps = [
	{
		number: "01",
		icon: Upload,
		label: "Upload your resume",
	},
	{
		number: "02",
		icon: ClipboardPaste,
		label: "Paste the job description",
	},
	{
		number: "03",
		icon: Download,
		label: "Download your tailored PDF",
	},
];

export const HowItWorks = () => {
	return (
		<section
			id="how-it-works"
			className="py-20 md:py-28 bg-surface-inset/30"
		>
			<div className="container mx-auto px-4">
				<h2 className="font-display text-2xl md:text-3xl font-semibold text-center mb-14">
					How it works
				</h2>

				<div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
					{steps.map((step) => {
						const Icon = step.icon;
						return (
							<div
								key={step.number}
								className="relative flex flex-col items-center text-center p-8 rounded-xl bg-surface-raised border border-border-visible"
							>
								{/* Step number */}
								<span className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-surface-base border border-border-visible rounded-md text-xs font-semibold text-accent">
									{step.number}
								</span>

								{/* Icon */}
								<div className="w-12 h-12 rounded-lg bg-accent-muted flex items-center justify-center mb-4 mt-1">
									<Icon
										size={22}
										className="text-accent"
									/>
								</div>

								{/* Label */}
								<p className="text-sm font-medium text-text-primary">
									{step.label}
								</p>
							</div>
						);
					})}
				</div>
			</div>
		</section>
	);
};
