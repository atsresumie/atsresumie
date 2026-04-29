import { Upload, ClipboardList, FileOutput } from "lucide-react";

const steps = [
	{
		icon: Upload,
		title: "Upload your resume",
		description:
			"Upload your current resume as PDF or DOCX — we'll parse it automatically.",
	},
	{
		icon: ClipboardList,
		title: "Paste the job description",
		description:
			"Paste the job posting you're targeting. We'll identify the key requirements and skills.",
	},
	{
		icon: FileOutput,
		title: "Generate → review → download",
		description:
			"Get a tailored, ATS-ready resume. Review the changes, then download your PDF.",
	},
];

export const HowItWorks = () => {
	return (
		<section id="how-it-works" className="py-[120px] px-4 md:px-[116px]">
			<div className="max-w-[1208px] mx-auto flex flex-col items-center gap-10">
				{/* Header */}
				<div className="text-center flex flex-col gap-5">
					<h2 className="font-display text-[28px] md:text-[36px] font-bold text-text-primary">
						How it works
					</h2>
					<p className="text-text-secondary text-base">
						Three simple steps to an ATS-optimized resume
					</p>
				</div>

				{/* Steps */}
				<div className="flex flex-col md:flex-row items-stretch justify-between w-full gap-6 md:gap-0">
					{steps.map((step, i) => (
						<div key={i} className="flex items-center">
							{/* Step card */}
							<div className="border border-dashed border-border-visible rounded-[5px] p-5 flex flex-col gap-3 w-full md:w-[312px]">
								<div className="bg-[var(--primary-brown-light)] w-[34px] h-[34px] flex items-center justify-center">
									<step.icon className="w-6 h-6 text-[var(--primary-brown)]" />
								</div>
								<h3 className="font-semibold text-lg text-text-primary">
									{step.title}
								</h3>
								<p className="text-sm text-text-secondary leading-normal">
									{step.description}
								</p>
							</div>

							{/* Arrow connector */}
							{i < steps.length - 1 && (
								<div className="hidden md:block w-[90px] flex-shrink-0 mx-auto">
									<div className="border-t border-dashed border-border-visible w-full" />
								</div>
							)}
						</div>
					))}
				</div>
			</div>
		</section>
	);
};
