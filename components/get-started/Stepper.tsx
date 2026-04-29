"use client";

import { motion, useReducedMotion } from "framer-motion";

export default function Stepper({
	steps,
	current,
}: {
	steps: string[];
	current: number;
}) {
	const reduceMotion = useReducedMotion();

	return (
		<div className="rounded-2xl border border-border-visible bg-surface-raised p-4 backdrop-blur">
			<div className="flex items-center justify-between text-xs text-text-secondary">
				{steps.map((s, idx) => (
					<div key={s} className="flex-1">
						<div className="flex items-center gap-2">
							<div
								className={[
									"h-2.5 w-2.5 rounded-full border",
									idx <= current
										? "border-cta bg-cta"
										: "border-border-visible bg-transparent",
								].join(" ")}
							/>
							<span
								className={
									idx === current ? "text-text-primary" : ""
								}
							>
								{s}
							</span>
						</div>
					</div>
				))}
			</div>

			<div className="mt-3 h-1.5 w-full rounded-full bg-surface-inset">
				<motion.div
					className="h-1.5 rounded-full bg-cta"
					initial={false}
					animate={{
						width: `${((current + 1) / steps.length) * 100}%`,
					}}
					transition={
						reduceMotion
							? { duration: 0 }
							: { type: "spring", stiffness: 140, damping: 20 }
					}
				/>
			</div>
		</div>
	);
}
