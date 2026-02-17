/**
 * TrustBar Component - Server Component
 *
 * Compact row of trust signals placed directly under the Hero.
 * Designed to be scannable and reinforce key value props at a glance.
 */

const trustItems = [
	"PDF & DOCX supported",
	"No fabricated experience",
	"ATS-friendly formatting",
	"Job-specific keywords",
	"Ready in minutes",
];

export const TrustBar = () => {
	return (
		<section className="relative py-6 md:py-8 border-b border-border-subtle/50">
			<div className="container mx-auto">
				<div className="flex flex-wrap items-center justify-center gap-2.5 md:gap-3">
					{trustItems.map((item) => (
						<span
							key={item}
							className="inline-flex items-center gap-1.5 text-xs md:text-sm px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-secondary/60 border border-border/60 text-secondary-foreground/90"
						>
							<span className="w-1 h-1 rounded-full bg-accent/70" />
							{item}
						</span>
					))}
				</div>
			</div>
		</section>
	);
};
