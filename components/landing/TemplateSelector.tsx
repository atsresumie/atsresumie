import Image from "next/image";

const templates = [
	{ src: "/landing/template-1.png", topPct: 0 },
	{ src: "/landing/template-2.png", topPct: 7.8 },
	{ src: "/landing/template-3.png", topPct: 17.5 },
	{ src: "/landing/template-4.png", topPct: 29.2 },
	{ src: "/landing/template-5.png", topPct: 42.8 },
];

export const TemplateSelector = () => {
	return (
		<section className="bg-surface-inset py-[60px] px-4 md:px-[116px]">
			<div className="max-w-[1208px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-12">
				{/* Left text */}
				<div className="flex flex-col gap-5 max-w-[480px]">
					<h2 className="font-display text-[28px] md:text-[36px] font-bold text-text-primary leading-tight">
						Switch templates anytime
					</h2>
					<p className="text-text-secondary text-base">
						Keep content, change format.
					</p>
				</div>

				{/* Right - cascading template images */}
				<div className="relative w-full max-w-[592px] aspect-[592/514] shrink-0 overflow-hidden">
					{templates.map((tmpl, i) => (
						<div
							key={i}
							className="absolute shadow-[0_0_4px_rgba(0,0,0,0.12)] rounded-sm overflow-hidden"
							style={{
								left: `${i * 19.28}%`,
								top: `${tmpl.topPct}%`,
								width: "34.8%",
								height: "56.8%",
							}}
						>
							<Image
								src={tmpl.src}
								alt={`Template ${i + 1}`}
								fill
								className="object-cover"
								sizes="(max-width: 768px) 35vw, 206px"
							/>
						</div>
					))}
				</div>
			</div>
		</section>
	);
};
