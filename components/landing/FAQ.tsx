import { useState, useRef } from "react";
import {
	motion,
	AnimatePresence,
	useInView,
	useReducedMotion,
} from "framer-motion";
import { ChevronDown } from "lucide-react";

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
	index: number;
	isInView: boolean;
}

const FAQItem = ({ faq, isOpen, onToggle, index, isInView }: FAQItemProps) => {
	const prefersReducedMotion = useReducedMotion();

	return (
		<motion.div
			initial={{ opacity: 0, y: 20 }}
			animate={isInView ? { opacity: 1, y: 0 } : {}}
			transition={{
				delay: prefersReducedMotion ? 0 : 0.1 + index * 0.08,
				type: "spring",
				damping: 20,
			}}
			className="border-b border-border/50 last:border-0"
		>
			<button
				onClick={onToggle}
				className="w-full py-6 flex items-center justify-between text-left group"
			>
				<span className="font-display text-lg font-medium group-hover:text-sand transition-colors pr-4">
					{faq.question}
				</span>
				<motion.div
					animate={{ rotate: isOpen ? 180 : 0 }}
					transition={{ type: "spring", damping: 20, stiffness: 300 }}
					className="flex-shrink-0"
				>
					<ChevronDown size={20} className="text-muted-foreground" />
				</motion.div>
			</button>

			<AnimatePresence initial={false}>
				{isOpen && (
					<motion.div
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: "auto", opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						transition={{
							type: "spring",
							damping: 25,
							stiffness: 200,
						}}
						className="overflow-hidden"
					>
						<motion.div
							initial={prefersReducedMotion ? {} : { y: -10 }}
							animate={{ y: 0 }}
							exit={prefersReducedMotion ? {} : { y: -10 }}
							transition={{ type: "spring", damping: 20 }}
							className="pb-6"
						>
							<p className="text-muted-foreground leading-relaxed">
								{faq.answer}
							</p>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</motion.div>
	);
};

export const FAQ = () => {
	const [openIndex, setOpenIndex] = useState<number | null>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const isInView = useInView(containerRef, { once: true, margin: "-100px" });

	return (
		<section id="faq" className="relative py-24 md:py-32">
			<div className="absolute inset-0 bg-gradient-to-b from-background via-muted/10 to-background" />

			<div ref={containerRef} className="container mx-auto relative z-10">
				{/* Section header */}
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					animate={isInView ? { opacity: 1, y: 0 } : {}}
					transition={{ type: "spring", damping: 20 }}
					className="text-center mb-12 md:mb-16"
				>
					<h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold mb-4">
						Frequently asked questions
					</h2>
					<p className="text-lg text-muted-foreground max-w-2xl mx-auto">
						Everything you need to know about atsresumie
					</p>
				</motion.div>

				{/* FAQ List */}
				<div className="max-w-3xl mx-auto bg-card-gradient rounded-2xl border border-border/50 px-6 md:px-8">
					{faqs.map((faq, index) => (
						<FAQItem
							key={faq.question}
							faq={faq}
							isOpen={openIndex === index}
							onToggle={() =>
								setOpenIndex(openIndex === index ? null : index)
							}
							index={index}
							isInView={isInView}
						/>
					))}
				</div>
			</div>
		</section>
	);
};
