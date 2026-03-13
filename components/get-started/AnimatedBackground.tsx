"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

export default function AnimatedBackground() {
	const reduceMotion = useReducedMotion();
	const [pos, setPos] = useState({ x: 50, y: 30 });

	useEffect(() => {
		if (reduceMotion) return;

		const handler = (e: MouseEvent) => {
			const x = (e.clientX / window.innerWidth) * 100;
			const y = (e.clientY / window.innerHeight) * 100;
			setPos({ x, y });
		};
		window.addEventListener("mousemove", handler, { passive: true });
		return () => window.removeEventListener("mousemove", handler);
	}, [reduceMotion]);

	const bloom = useMemo(() => {
		return `radial-gradient(700px 500px at ${pos.x}% ${pos.y}%, rgba(101,72,68,0.08), rgba(101,72,68,0.00) 55%)`;
	}, [pos]);

	return (
		<div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
			{/* Base gradient - warm beige tones */}
			<div className="absolute inset-0 bg-[radial-gradient(1200px_700px_at_20%_10%,rgba(196,177,152,0.2),rgba(229,213,190,0)),radial-gradient(1000px_700px_at_70%_20%,rgba(212,195,169,0.15),rgba(229,213,190,0)),linear-gradient(180deg,#E5D5BE_0%,#dcc9ae_60%,#d4c0a5_100%)]" />

			{/* Slowly drifting sheen */}
			{!reduceMotion && (
				<motion.div
					className="absolute -inset-40 opacity-70"
					animate={{ rotate: [0, 6, 0], scale: [1, 1.06, 1] }}
					transition={{
						duration: 16,
						repeat: Infinity,
						ease: "easeInOut",
					}}
					style={{
						background:
							"radial-gradient(900px 500px at 40% 40%, rgba(196,177,152,0.2), rgba(229,213,190,0) 60%)",
					}}
				/>
			)}

			{/* Cursor reactive bloom */}
			<div
				className="absolute inset-0"
				style={{ backgroundImage: bloom }}
			/>

			{/* Grain */}
			<div
				className="absolute inset-0 opacity-[0.06] mix-blend-soft-light"
				style={{
					backgroundImage:
						"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23n)' opacity='.5'/%3E%3C/svg%3E\")",
				}}
			/>
		</div>
	);
}
