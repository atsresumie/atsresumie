"use client";

export default function AtsRing({ value }: { value: number }) {
	const pct = Math.max(0, Math.min(100, value));
	const r = 18;
	const c = 2 * Math.PI * r;
	const dash = (pct / 100) * c;

	return (
		<svg viewBox="0 0 48 48" className="h-24 w-24">
			<circle
				cx="24"
				cy="24"
				r={r}
				stroke="rgba(233,221,199,0.12)"
				strokeWidth="6"
				fill="none"
			/>
			<circle
				cx="24"
				cy="24"
				r={r}
				stroke="rgba(233,221,199,0.75)"
				strokeWidth="6"
				fill="none"
				strokeLinecap="round"
				strokeDasharray={`${dash} ${c - dash}`}
				transform="rotate(-90 24 24)"
			/>
			<text
				x="24"
				y="27"
				textAnchor="middle"
				className="fill-[#E9DDC7]"
				fontSize="10"
				fontWeight="600"
			>
				{pct}
			</text>
		</svg>
	);
}
