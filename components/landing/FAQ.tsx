"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const faqItems = [
	{
		question: "Will it invent experience?",
		answer: "No. Every bullet is grounded in your original resume — nothing fabricated.",
	},
	{
		question: "Is it ATS compliant?",
		answer: "Yes. Our output uses clean, single-column formatting with standard section headers that all major ATS systems can parse reliably.",
	},
	{
		question: "What formats are supported?",
		answer: "You can upload PDF or DOCX resumes, and download your tailored resume as a clean PDF optimized for ATS parsing.",
	},
	{
		question: "Do I need to rewrite everything?",
		answer: "No. We preserve your original structure and experience — we only adjust wording, keywords, and formatting to match the target job description.",
	},
	{
		question: "Can I try it free?",
		answer: "Yes. You get 3 free credits on signup — no credit card required. Each credit generates one tailored resume.",
	},
];

export const FAQ = () => {
	const [openIndex, setOpenIndex] = useState(0);

	return (
		<section id="faq" className="py-[60px] px-4 md:px-[116px]">
			<div className="max-w-[1208px] mx-auto flex flex-col items-center gap-10">
				<h2 className="font-display text-[28px] md:text-[36px] font-bold text-text-primary text-center">
					FAQ
				</h2>

				<div className="border border-border-visible rounded-[5px] w-full max-w-[900px]">
					{faqItems.map((item, i) => (
						<div key={i}>
							<button
								onClick={() =>
									setOpenIndex(openIndex === i ? -1 : i)
								}
								className="w-full p-5 flex items-start justify-between text-left cursor-pointer"
							>
								<span className="font-semibold text-sm text-black">
									{item.question}
								</span>
								{openIndex === i ? (
									<ChevronUp className="w-6 h-6 text-text-tertiary flex-shrink-0" />
								) : (
									<ChevronDown className="w-6 h-6 text-text-tertiary flex-shrink-0" />
								)}
							</button>
							{openIndex === i && (
								<div className="px-5 pb-5">
									<p className="text-sm text-text-secondary leading-[22px]">
										{item.answer}
									</p>
								</div>
							)}
							{i < faqItems.length - 1 && (
								<div className="h-px bg-[#d9d9d9]" />
							)}
						</div>
					))}
				</div>
			</div>
		</section>
	);
};
