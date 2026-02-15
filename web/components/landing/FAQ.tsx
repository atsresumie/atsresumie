"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

/**
 * FAQ Component - Client Component (for accordion state)
 * Uses CSS transitions instead of framer-motion
 */

const faqs = [
	{
		question: "Is the ATS score exact?",
		answer: "Our ATS score is an estimate based on industry-standard parsing algorithms. While no score can guarantee results, we optimize for the most common ATS systems used by employers.",
	},
	{
		question: "Do you support PDF/DOCX upload?",
		answer: "Yes! You can upload your existing resume as PDF or DOCX, or simply paste the text directly. Our system will parse and analyze your content automatically.",
	},
	{
		question: "Do I get the LaTeX source?",
		answer: "Absolutely. Every export includes both the compiled PDF and the full LaTeX source code, so you can make manual adjustments if needed.",
	},
	{
		question: "What costs a credit?",
		answer: "Previewing your ATS score and generating improvements uses 1 credit. Exporting (downloading the PDF and LaTeX source) is free. You get 3 free credits on signup.",
	},
	{
		question: "Will it work for non-tech roles?",
		answer: "Yes! While our templates work exceptionally well for tech and business roles, our ATS optimization applies to any industry. The system adapts to your target job description.",
	},
];

interface FAQItemProps {
	faq: (typeof faqs)[0];
	isOpen: boolean;
	onToggle: () => void;
}

const FAQItem = ({ faq, isOpen, onToggle }: FAQItemProps) => {
	return (
		<div className="border-b border-border-subtle last:border-0">
			<button
				onClick={onToggle}
				className="w-full py-6 flex items-center justify-between text-left group"
			>
				<span className="font-display text-lg font-medium group-hover:text-accent transition-colors pr-4">
					{faq.question}
				</span>
				<div
					className={`flex-shrink-0 transition-transform duration-200 ${
						isOpen ? "rotate-180" : ""
					}`}
				>
					<ChevronDown size={20} className="text-text-secondary" />
				</div>
			</button>

			<div
				className={`overflow-hidden transition-all duration-300 ease-out ${
					isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
				}`}
			>
				<div className="pb-6">
					<p className="text-text-secondary leading-relaxed">
						{faq.answer}
					</p>
				</div>
			</div>
		</div>
	);
};

export const FAQ = () => {
	const [openIndex, setOpenIndex] = useState<number | null>(null);

	return (
		<section id="faq" className="relative py-24 md:py-32">
			<div className="absolute inset-0 bg-gradient-to-b from-surface-base via-surface-raised/10 to-surface-base" />

			<div className="container mx-auto relative z-10">
				{/* Section header */}
				<div className="text-center mb-12 md:mb-16 animate-fade-in-up">
					<h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold mb-4">
						Frequently asked questions
					</h2>
					<p className="text-lg text-text-secondary max-w-2xl mx-auto">
						Everything you need to know about atsresumie
					</p>
				</div>

				{/* FAQ List */}
				<div className="max-w-3xl mx-auto bg-surface-raised rounded-sm border border-border-visible px-6 md:px-8 animate-fade-in-up animation-delay-200">
					{faqs.map((faq, index) => (
						<FAQItem
							key={faq.question}
							faq={faq}
							isOpen={openIndex === index}
							onToggle={() =>
								setOpenIndex(openIndex === index ? null : index)
							}
						/>
					))}
				</div>
			</div>
		</section>
	);
};
