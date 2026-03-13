"use client";

interface ActionButtonsProps {
	canAnalyze: boolean;
	isAnalyzing: boolean;
	onBack: () => void;
	onAnalyze: () => void;
}

export default function ActionButtons({
	canAnalyze,
	isAnalyzing,
	onBack,
	onAnalyze,
}: ActionButtonsProps) {
	return (
		<div className="flex flex-col gap-3 pt-2 sm:flex-row">
			<button
				disabled={!canAnalyze}
				onClick={() => {
					onAnalyze();
				}}
				className="inline-flex w-full items-center justify-center rounded-xl bg-cta px-4 py-3 text-sm font-medium text-cta-foreground shadow-card hover:-translate-y-px active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
			>
				{isAnalyzing ? "Tailoring…" : "Tailor My Resume"}
			</button>
		</div>
	);
}
