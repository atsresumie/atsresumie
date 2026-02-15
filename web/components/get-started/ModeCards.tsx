"use client";

import { motion, useReducedMotion } from "framer-motion";

export type ResumeMode = "QUICK" | "DEEP" | "FROM_SCRATCH";

const modes: {
	key: ResumeMode;
	title: string;
	desc: string;
	badge: string;
}[] = [
	{
		key: "QUICK",
		title: "Quick Optimize",
		desc: "Minimal inputs, strong results.",
		badge: "Best for speed",
	},
	{
		key: "DEEP",
		title: "Deep Tailor",
		desc: "Extra questions for the best match.",
		badge: "Best results",
	},
	{
		key: "FROM_SCRATCH",
		title: "From Scratch",
		desc: "Build from profile details.",
		badge: "New resume",
	},
];

export default function ModeCards({
	value,
	onChange,
}: {
	value: ResumeMode;
	onChange: (v: ResumeMode) => void;
}) {
	const reduceMotion = useReducedMotion();

	return (
		<div className="grid gap-3 md:grid-cols-3">
			{modes.map((m) => {
				const selected = value === m.key;

				return (
					<motion.button
						key={m.key}
						onClick={() => onChange(m.key)}
						whileHover={
							reduceMotion
								? undefined
								: { rotateX: -2, rotateY: 2, y: -2 }
						}
						whileTap={reduceMotion ? undefined : { scale: 0.98 }}
						style={{ transformStyle: "preserve-3d" }}
						className={[
							"text-left rounded-2xl border p-4 transition",
							selected
								? "border-[rgba(233,221,199,0.35)] bg-[rgba(233,221,199,0.08)] shadow-[0_18px_60px_rgba(0,0,0,0.35)]"
								: "border-[rgba(233,221,199,0.12)] bg-[rgba(233,221,199,0.04)] hover:border-[rgba(233,221,199,0.20)]",
						].join(" ")}
					>
						<div className="text-xs text-[rgba(233,221,199,0.65)]">
							{m.badge}
						</div>
						<div className="mt-1 text-sm font-semibold">
							{m.title}
						</div>
						<div className="mt-1 text-xs leading-relaxed text-[rgba(233,221,199,0.70)]">
							{m.desc}
						</div>

						{/* animated border glow */}
						<div className="relative mt-3 h-0.5 w-full overflow-hidden rounded-full bg-[rgba(233,221,199,0.10)]">
							{!reduceMotion && selected && (
								<motion.div
									className="absolute inset-y-0 left-0 w-1/3 bg-[rgba(233,221,199,0.55)]"
									animate={{ x: ["-40%", "260%"] }}
									transition={{
										duration: 1.8,
										repeat: Infinity,
										ease: "easeInOut",
									}}
								/>
							)}
						</div>
					</motion.button>
				);
			})}
		</div>
	);
}
