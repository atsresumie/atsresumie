import { Check, ArrowLeftRight } from "lucide-react";

/**
 * TemplateSelector — Server Component
 *
 * Template flexibility block. Shows template thumbnails with
 * one selected and switch indicator. No future-label needed.
 */

const templates = [
	{
		name: "Classic",
		lines: [
			{ w: "w-16", pos: "top" },
			{ w: "w-full", pos: "mid" },
			{ w: "w-3/4", pos: "mid" },
			{ w: "w-full", pos: "bot" },
			{ w: "w-5/6", pos: "bot" },
		],
		selected: false,
	},
	{
		name: "Modern",
		lines: [
			{ w: "w-20", pos: "top" },
			{ w: "w-full", pos: "mid" },
			{ w: "w-5/6", pos: "mid" },
			{ w: "w-full", pos: "bot" },
			{ w: "w-2/3", pos: "bot" },
		],
		selected: true,
	},
	{
		name: "Minimal",
		lines: [
			{ w: "w-14", pos: "top" },
			{ w: "w-full", pos: "mid" },
			{ w: "w-2/3", pos: "mid" },
			{ w: "w-full", pos: "bot" },
			{ w: "w-4/5", pos: "bot" },
		],
		selected: false,
	},
	{
		name: "Executive",
		lines: [
			{ w: "w-24", pos: "top" },
			{ w: "w-full", pos: "mid" },
			{ w: "w-4/5", pos: "mid" },
			{ w: "w-full", pos: "bot" },
			{ w: "w-3/4", pos: "bot" },
		],
		selected: false,
	},
];

export const TemplateSelector = () => {
	return (
		<section className="py-20 md:py-28">
			<div className="container mx-auto px-4">
				{/* Section header */}
				<div className="text-center mb-12">
					<h2 className="font-display text-3xl md:text-4xl font-bold">
						Switch templates anytime
					</h2>
					<p className="text-sm text-text-secondary mt-3 max-w-sm mx-auto">
						Keep content, change format.
					</p>
				</div>

				{/* Template grid */}
				<div className="max-w-3xl mx-auto">
					<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
						{templates.map((tpl) => (
							<div key={tpl.name} className="flex flex-col items-center">
								{/* Template thumbnail */}
								<div
									className={`relative w-full aspect-[3/4] rounded-lg border-2 p-3 transition-all cursor-pointer hover:shadow-card ${
										tpl.selected
											? "border-accent bg-surface-raised shadow-card"
											: "border-border-visible bg-surface-raised/60 hover:border-accent/30"
									}`}
								>
									{/* Selected badge */}
									{tpl.selected && (
										<div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-accent flex items-center justify-center">
											<Check
												size={10}
												className="text-white"
											/>
										</div>
									)}

									{/* Faux resume lines */}
									<div className="space-y-2.5">
										{/* Name area */}
										<div className={`h-2 rounded-full bg-accent/25 ${tpl.lines[0].w}`} />

										{/* Separator */}
										<div className="border-t border-border-subtle/60" />

										{/* Experience section */}
										<div className="space-y-1.5">
											<div className={`h-1.5 rounded-full bg-text-primary/10 ${tpl.lines[1].w}`} />
											<div className={`h-1.5 rounded-full bg-text-primary/10 ${tpl.lines[2].w}`} />
										</div>

										{/* Separator */}
										<div className="border-t border-border-subtle/60" />

										{/* Skills section */}
										<div className="space-y-1.5">
											<div className={`h-1.5 rounded-full bg-text-primary/10 ${tpl.lines[3].w}`} />
											<div className={`h-1.5 rounded-full bg-text-primary/10 ${tpl.lines[4].w}`} />
										</div>
									</div>
								</div>

								{/* Template name */}
								<div className="flex items-center gap-1.5 mt-2.5">
									<span
										className={`text-xs font-medium ${
											tpl.selected
												? "text-accent"
												: "text-text-secondary"
										}`}
									>
										{tpl.name}
									</span>
									{tpl.selected && (
										<ArrowLeftRight
											size={10}
											className="text-accent"
										/>
									)}
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Reassurance */}
				<p className="text-center text-xs text-text-tertiary mt-8">
					Choose the layout that fits your style — switch without losing content.
				</p>
			</div>
		</section>
	);
};
