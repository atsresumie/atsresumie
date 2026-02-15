"use client";

import { Sparkles } from "lucide-react";
import ModeCards, { ResumeMode } from "../ModeCards";

interface Step0ModeSelectionProps {
	mode: ResumeMode;
	onModeChange: (mode: ResumeMode) => void;
	canContinue: boolean;
	onContinue: () => void;
}

export default function Step0ModeSelection({
	mode,
	onModeChange,
	canContinue,
	onContinue,
}: Step0ModeSelectionProps) {
	return (
		<section className="space-y-4">
			<div className="flex items-center gap-2 text-sm text-[rgba(233,221,199,0.75)]">
				<Sparkles className="h-4 w-4" />
				Pick the level of tailoring
			</div>

			<ModeCards value={mode} onChange={onModeChange} />

			<div className="pt-2">
				<button
					disabled={!canContinue}
					onClick={onContinue}
					className="inline-flex w-full items-center justify-center rounded-xl bg-[#E9DDC7] px-4 py-3 text-sm font-medium text-[#2a1e18] shadow-[0_10px_30px_rgba(233,221,199,0.12)] hover:-translate-y-px hover:shadow-[0_16px_40px_rgba(233,221,199,0.16)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
				>
					Continue
				</button>
			</div>
		</section>
	);
}
