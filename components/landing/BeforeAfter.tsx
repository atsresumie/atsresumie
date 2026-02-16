"use client";

import { useState } from "react";
import { X, Check, ArrowRight } from "lucide-react";

/**
 * BeforeAfter Component - Client Component (for toggle state)
 * Uses CSS transitions instead of framer-motion
 */

const beforeBullets = [
	{
		label: "General Resume",
		bullet: "Managed various projects and contributed to team goals across departments",
	},
	{
		label: "General Resume",
		bullet: "Worked with databases and backend systems to improve performance",
	},
	{
		label: "General Resume",
		bullet: "Helped develop software solutions for internal and external use",
	},
];

const afterBullets = [
	{
		label: "Tailored for this Job",
		bullet: "Led migration of 3 legacy services to AWS, reducing deployment time by 40%",
	},
	{
		label: "Tailored for this Job",
		bullet: "Optimized PostgreSQL queries processing 2M+ records/day, cutting latency by 60%",
	},
	{
		label: "Tailored for this Job",
		bullet: "Built CI/CD pipeline with GitHub Actions adopted by 4 engineering teams",
	},
];

/* Mini before/after examples — compact, anonymized */
const miniExamples = [
	{
		before: "Responsible for customer communications and issue resolution",
		after: "Resolved 50+ customer tickets/week via Zendesk, maintaining 96% CSAT score",
		role: "Customer Support",
	},
	{
		before: "Analyzed data and created reports for management",
		after: "Built automated Tableau dashboards tracking $2M pipeline, reducing reporting time by 70%",
		role: "Data Analyst",
	},
];

const commonRoles = [
	"Software Engineer",
	"Data Analyst",
	"Sales Associate",
	"Restaurant Supervisor",
	"Customer Support",
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
						See how ATSResumie creates an ATS-friendly resume
						tailored to the role
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
							General Resume
						</button>
						<button
							onClick={() => setShowAfter(true)}
							className={`relative px-6 py-2.5 rounded-sm font-medium text-sm transition-all duration-200 ${
								showAfter
									? "bg-accent text-accent-foreground"
									: "text-text-secondary hover:text-text-primary"
							}`}
						>
							Tailored for this Job
						</button>
					</div>
				</div>

				{/* Main Content Card */}
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
									General Resume
								</h3>
							</div>
							<ul className="space-y-4">
								{beforeBullets.map((item, i) => (
									<li
										key={i}
										className="flex items-start gap-3 text-text-secondary"
										style={{
											animationDelay: `${i * 50}ms`,
										}}
									>
										<div className="w-1.5 h-1.5 rounded-full bg-error/60 mt-2 flex-shrink-0" />
										<span>{item.bullet}</span>
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
									Tailored for this Job
								</h3>
							</div>
							<ul className="space-y-4">
								{afterBullets.map((item, i) => (
									<li
										key={i}
										className="flex items-start gap-3 text-text-primary"
										style={{
											animationDelay: `${i * 50}ms`,
										}}
									>
										<ArrowRight
											size={14}
											className="text-accent mt-1 flex-shrink-0"
										/>
										<span>{item.bullet}</span>
									</li>
								))}
							</ul>
						</div>
					</div>
				</div>

				{/* Mini before/after examples */}
				<div className="max-w-4xl mx-auto mt-8 grid md:grid-cols-2 gap-4 animate-fade-in-up animation-delay-400">
					{miniExamples.map((example) => (
						<div
							key={example.role}
							className="bg-surface-raised/60 rounded-sm border border-border-visible/70 p-5"
						>
							<p className="text-xs font-medium uppercase tracking-wide text-text-tertiary mb-3">
								{example.role}
							</p>
							<div className="space-y-2.5">
								<div className="flex items-start gap-2">
									<X
										size={12}
										className="text-error/70 mt-0.5 flex-shrink-0"
									/>
									<p className="text-sm text-text-secondary/80 line-through decoration-error/30">
										{example.before}
									</p>
								</div>
								<div className="flex items-start gap-2">
									<ArrowRight
										size={12}
										className="text-accent mt-0.5 flex-shrink-0"
									/>
									<p className="text-sm text-text-primary">
										{example.after}
									</p>
								</div>
							</div>
						</div>
					))}
				</div>

				{/* Common roles */}
				<div className="text-center mt-10 animate-fade-in-up animation-delay-500">
					<p className="text-sm text-text-tertiary">
						{commonRoles.map((role, i) => (
							<span key={role}>
								{role}
								{i < commonRoles.length - 1 && (
									<span className="mx-2 text-border-visible">
										•
									</span>
								)}
							</span>
						))}
					</p>
				</div>
			</div>
		</section>
	);
};
