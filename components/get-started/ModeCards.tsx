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
		title: "Fast improvement",
		desc: "Light optimization — keeps your structure intact.",
		badge: "Fastest",
	},
	{
		key: "DEEP",
		title: "Stronger re-writing",
		desc: "Deeper rewrite with better keyword alignment.",
		badge: "Best results",
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
		<div className="grid gap-3 md:grid-cols-2">
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
								? "border-cta bg-surface-inset shadow-card"
								: "border-border-visible bg-surface-base hover:border-text-secondary",
						].join(" ")}
					>
						<div className="text-xs text-text-secondary">
							{m.badge}
						</div>
						<div className="mt-1 text-sm font-semibold">
							{m.title}
						</div>
						<div className="mt-1 text-xs leading-relaxed text-text-secondary">
							{m.desc}
						</div>

						{/* animated border glow */}
						<div className="relative mt-3 h-0.5 w-full overflow-hidden rounded-full bg-surface-inset">
							{!reduceMotion && selected && (
								<motion.div
									className="absolute inset-y-0 left-0 w-1/3 bg-cta"
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
