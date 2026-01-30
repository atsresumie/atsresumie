"use client";

import { motion, useReducedMotion } from "framer-motion";

export default function SidePanel() {
	const reduceMotion = useReducedMotion();

	return (
		<motion.div
			initial={reduceMotion ? false : { opacity: 0, y: 14 }}
			animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
			transition={{
				type: "spring",
				stiffness: 110,
				damping: 18,
				delay: 0.05,
			}}
			className="rounded-2xl border border-[rgba(233,221,199,0.12)] bg-[rgba(20,14,11,0.45)] p-5 backdrop-blur"
		>
			<div className="text-sm font-medium">What you&apos;ll get</div>
			<ul className="mt-3 space-y-2 text-sm text-[rgba(233,221,199,0.75)]">
				<li>• ATS-friendly structure + keyword alignment</li>
				<li>• Versioned results for each job posting</li>
				<li>• Export-ready PDF from your dashboard</li>
			</ul>

			<div className="mt-5 rounded-xl border border-[rgba(233,221,199,0.12)] bg-[rgba(233,221,199,0.04)] p-4">
				<div className="text-xs text-[rgba(233,221,199,0.65)]">
					Credits
				</div>
				<div className="mt-1 text-lg font-semibold">3 free credits</div>
				<div className="mt-1 text-xs" style={{ color: "#FFA726" }}>
					Preview costs 1 credit. Download is free.
				</div>
			</div>

			<div className="mt-4 text-xs text-[rgba(233,221,199,0.6)]">
				Tip: Add measurable impact (&ldquo;reduced latency by
				32%&rdquo;) to boost your score.
			</div>
		</motion.div>
	);
}
