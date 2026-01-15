"use client";

import { motion, useReducedMotion } from "framer-motion";

export default function KeywordBars({
	items,
}: {
	items: { label: string; value: number }[];
}) {
	const reduceMotion = useReducedMotion();

	return (
		<div className="space-y-3">
			{items.map((it) => {
				const v = Math.max(0, Math.min(100, it.value));
				return (
					<div key={it.label}>
						<div className="flex items-center justify-between text-xs text-[rgba(233,221,199,0.65)]">
							<span>{it.label}</span>
							<span>{v}%</span>
						</div>
						<div className="mt-1 h-2 w-full rounded-full bg-[rgba(233,221,199,0.10)]">
							<motion.div
								className="h-2 rounded-full bg-[rgba(233,221,199,0.70)]"
								initial={false}
								animate={{ width: `${v}%` }}
								transition={
									reduceMotion
										? { duration: 0 }
										: {
												type: "spring",
												stiffness: 120,
												damping: 18,
										  }
								}
							/>
						</div>
					</div>
				);
			})}
		</div>
	);
}
