import Image from "next/image";

const templates = [
	{ src: "/landing/template-1.png", top: 0 },
	{ src: "/landing/template-2.png", top: 40 },
	{ src: "/landing/template-3.png", top: 90 },
	{ src: "/landing/template-4.png", top: 150 },
	{ src: "/landing/template-5.png", top: 220 },
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
				<div className="relative w-[500px] md:w-[592px] h-[400px] md:h-[514px] flex-shrink-0 overflow-hidden">
					{templates.map((tmpl, i) => (
						<div
							key={i}
							className="absolute shadow-[0_0_4px_rgba(0,0,0,0.12)] rounded-sm overflow-hidden"
							style={{
								left: `${i * 96.4}px`,
								top: `${tmpl.top}px`,
								width: "206px",
								height: "292px",
							}}
						>
							<Image
								src={tmpl.src}
								alt={`Template ${i + 1}`}
								fill
								className="object-cover"
								sizes="206px"
							/>
						</div>
					))}
				</div>
			</div>
		</section>
	);
};
