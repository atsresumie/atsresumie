/**
 * TrustBar — Server Component
 *
 * 3 label-like reassurance items. Minimal styling.
 */

const items = [
	"No credit card required",
	"ATS-friendly output",
	"Ready in minutes",
];

export const TrustBar = () => {
	return (
		<section className="py-5 md:py-6 border-b border-border-subtle/40">
			<div className="container mx-auto px-4">
				<div className="flex items-center justify-center gap-6 md:gap-10 text-sm text-text-secondary">
					{items.map((item, i) => (
						<span key={item} className="flex items-center gap-3">
							{item}
							{i < items.length - 1 && (
								<span className="hidden sm:inline text-border-visible ml-3">
									·
								</span>
							)}
						</span>
					))}
				</div>
			</div>
		</section>
	);
};
