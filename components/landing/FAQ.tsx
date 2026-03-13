"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

/**
 * FAQ — Client Component (accordion state)
 *
 * Clean accordion, concise 1-2 sentence answers.
 */

const faqs = [
	{
		question: "Will it invent experience?",
		answer: "No. Every bullet is grounded in your original resume — nothing fabricated.",
	},
	{
		question: "Is it ATS compliant?",
		answer: "Yes. Output uses clean, parsable formatting that passes automated screening.",
	},
	{
		question: "What formats are supported?",
		answer: "Upload PDF or DOCX. Download as PDF or DOCX.",
	},
	{
		question: "Do I need to rewrite everything?",
		answer: "No. It tailors your existing resume to the job description automatically.",
	},
	{
		question: "Can I try it free?",
		answer: "Yes. You get 3 free credits on signup, no credit card required.",
	},
];

export const FAQ = () => {
	const [openIndex, setOpenIndex] = useState<number | null>(null);

	return (
		<section id="faq" className="py-20 md:py-28 bg-surface-inset/30">
			<div className="container mx-auto px-4">
				<h2 className="font-display text-2xl md:text-3xl font-semibold text-center mb-14">
					FAQ
				</h2>

				<div className="max-w-2xl mx-auto bg-surface-raised rounded-xl border border-border-visible px-5 md:px-7">
					{faqs.map((faq, index) => (
						<div
							key={faq.question}
							className="border-b border-border-subtle last:border-0"
						>
							<button
								onClick={() =>
									setOpenIndex(
										openIndex === index
											? null
											: index,
									)
								}
								className="w-full py-5 flex items-center justify-between text-left group"
							>
								<span className="text-sm font-medium text-text-primary group-hover:text-accent transition-colors pr-4">
									{faq.question}
								</span>
								<ChevronDown
									size={16}
									className={`text-text-tertiary transition-transform duration-200 flex-shrink-0 ${
										openIndex === index
											? "rotate-180"
											: ""
									}`}
								/>
							</button>

							<div
								className={`overflow-hidden transition-all duration-200 ${
									openIndex === index
										? "max-h-40 opacity-100"
										: "max-h-0 opacity-0"
								}`}
							>
								<p className="pb-5 text-sm text-text-secondary leading-relaxed">
									{faq.answer}
								</p>
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
};
