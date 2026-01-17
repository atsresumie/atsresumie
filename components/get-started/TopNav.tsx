"use client";

import { RotateCcw } from "lucide-react";

interface TopNavProps {
	onReset: () => void;
}

export default function TopNav({ onReset }: TopNavProps) {
	return (
		<div className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5">
			<div className="flex items-center gap-2">
				<div className="h-8 w-8 rounded-xl bg-linear-to-br from-[#3B2A21] to-[#C8B08A] shadow-[0_0_0_1px_rgba(233,221,199,0.15)]" />
				<span className="font-semibold tracking-tight">
					atsresumie
				</span>
			</div>

			<div className="flex items-center gap-3">
				<button
					onClick={onReset}
					className="hidden rounded-xl border border-[rgba(233,221,199,0.15)] bg-[rgba(233,221,199,0.06)] px-3 py-2 text-sm hover:bg-[rgba(233,221,199,0.10)] md:inline-flex"
				>
					<RotateCcw className="mr-2 h-4 w-4" />
					Reset
				</button>

				<div className="rounded-full border border-[rgba(233,221,199,0.15)] bg-[rgba(233,221,199,0.06)] px-3 py-1 text-xs">
					Preview free • Export uses credits
				</div>
			</div>
		</div>
	);
}
