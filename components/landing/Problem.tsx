import { MessageCircleWarning } from "lucide-react";

/**
 * Problem Section - Server Component
 *
 * Calls out the ChatGPT workflow explicitly and positions ATSResumie as
 * the purpose-built alternative.
 */
export const Problem = () => {
	return (
		<section className="relative py-20 md:py-28 overflow-hidden">
			{/* Background */}
			<div className="absolute inset-0 bg-gradient-to-b from-surface-raised/30 via-surface-base to-surface-base" />

			<div className="container mx-auto relative z-10">
				<div className="max-w-3xl mx-auto text-center animate-fade-in-up">
					{/* Icon */}
					<div className="inline-flex items-center justify-center w-14 h-14 rounded-sm bg-surface-raised border border-border-visible mb-6">
						<MessageCircleWarning
							size={26}
							className="text-accent"
						/>
					</div>

					{/* Title */}
					<h2 className="font-display text-2xl md:text-3xl lg:text-4xl font-semibold mb-6 leading-snug">
						If you&apos;re pasting your resume + a job description
						into ChatGPT…
					</h2>

					{/* Body */}
					<p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-fade-in-up animation-delay-200">
						You&apos;re already doing the right thing — but generic
						prompts are inconsistent. ATSResumie is built
						specifically for job-specific ATS tailoring.
					</p>
				</div>
			</div>
		</section>
	);
};
