"use client";

import { Sparkles } from "lucide-react";
import ModeCards, { ResumeMode } from "../ModeCards";

interface Step0ModeSelectionProps {
	mode: ResumeMode;
	onModeChange: (mode: ResumeMode) => void;
	canContinue?: boolean;
	onContinue?: () => void;
}

export default function Step0ModeSelection({
	mode,
	onModeChange,
}: Step0ModeSelectionProps) {
	return (
		<section className="space-y-4">
			<div className="flex items-center gap-2 text-sm text-[rgba(233,221,199,0.75)]">
				<Sparkles className="h-4 w-4" />
				Choose your tailoring mode
			</div>

			<ModeCards value={mode} onChange={onModeChange} />
		</section>
	);
}
