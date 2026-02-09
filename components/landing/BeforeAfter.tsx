"use client";

import { useState } from "react";
import { X, Check } from "lucide-react";

/**
 * BeforeAfter Component - Client Component (for toggle state)
 * Uses CSS transitions instead of framer-motion
 */

const beforePoints = [
	"Generic objective statement",
	"Inconsistent formatting",
	"Missing keywords",
	"Dense paragraphs",
	"Irrelevant skills listed",
];

const afterPoints = [
	"Tailored professional summary",
	"ATS-compatible structure",
	"Job-matched keywords",
	"Clear bullet points",
	"Role-specific skills highlighted",
];

export const BeforeAfter = () => {
	const [showAfter, setShowAfter] = useState(false);

	return (
		<section className="relative py-24 md:py-32 overflow-hidden">
			{/* Background gradient */}
			<div className="absolute inset-0 bg-gradient-to-b from-surface-base via-surface-raised/10 to-surface-base" />

			<div className="container mx-auto relative z-10">
				{/* Section header */}
				<div className="text-center mb-12 md:mb-16 animate-fade-in-up">
					<h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold mb-4">
						The transformation
					</h2>
					<p className="text-lg text-text-secondary max-w-2xl mx-auto">
						See how we optimize your resume for ATS success
					</p>
				</div>

				{/* Toggle */}
				<div className="flex justify-center mb-12 animate-fade-in-up animation-delay-200">
					<div className="inline-flex items-center p-1.5 bg-surface-inset rounded-sm border border-border-visible">
						<button
							onClick={() => setShowAfter(false)}
							className={`relative px-6 py-2.5 rounded-sm font-medium text-sm transition-all duration-200 ${
								!showAfter
									? "bg-accent text-accent-foreground"
									: "text-text-secondary hover:text-text-primary"
							}`}
						>
							Before
						</button>
						<button
							onClick={() => setShowAfter(true)}
							className={`relative px-6 py-2.5 rounded-sm font-medium text-sm transition-all duration-200 ${
								showAfter
									? "bg-accent text-accent-foreground"
									: "text-text-secondary hover:text-text-primary"
							}`}
						>
							After
						</button>
					</div>
				</div>

				{/* Content Card */}
				<div className="max-w-2xl mx-auto animate-fade-in-up animation-delay-300">
					<div className="relative bg-surface-raised rounded-sm border border-border-visible p-8 md:p-10 overflow-hidden">
						{/* Before content */}
						<div
							className={`transition-all duration-300 ${
								!showAfter
									? "opacity-100 translate-x-0"
									: "opacity-0 -translate-x-4 absolute inset-8 md:inset-10"
							}`}
						>
							<div className="flex items-center gap-3 mb-6">
								<div className="w-10 h-10 rounded-full bg-error/20 flex items-center justify-center">
									<X size={18} className="text-error" />
								</div>
								<h3 className="font-display text-xl font-medium">
									Common resume issues
								</h3>
							</div>
							<ul className="space-y-4">
								{beforePoints.map((point, i) => (
									<li
										key={point}
										className="flex items-center gap-3 text-text-secondary"
										style={{
											animationDelay: `${i * 50}ms`,
										}}
									>
										<div className="w-1.5 h-1.5 rounded-full bg-error/60" />
										{point}
									</li>
								))}
							</ul>
						</div>

						{/* After content */}
						<div
							className={`transition-all duration-300 ${
								showAfter
									? "opacity-100 translate-x-0"
									: "opacity-0 translate-x-4 absolute inset-8 md:inset-10"
							}`}
						>
							<div className="flex items-center gap-3 mb-6">
								<div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
									<Check size={18} className="text-accent" />
								</div>
								<h3 className="font-display text-xl font-medium">
									After atsresumie
								</h3>
							</div>
							<ul className="space-y-4">
								{afterPoints.map((point, i) => (
									<li
										key={point}
										className="flex items-center gap-3 text-text-primary"
										style={{
											animationDelay: `${i * 50}ms`,
										}}
									>
										<div className="w-1.5 h-1.5 rounded-full bg-accent" />
										{point}
									</li>
								))}
							</ul>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
};
