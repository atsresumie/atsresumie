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
				onClick={onBack}
				className="inline-flex w-full items-center justify-center rounded-xl border border-[rgba(233,221,199,0.15)] bg-[rgba(233,221,199,0.06)] px-4 py-3 text-sm hover:bg-[rgba(233,221,199,0.10)] sm:w-1/2"
			>
				Back
			</button>
			<button
				disabled={!canAnalyze}
				onClick={() => {
					onAnalyze();
				}}
				className="inline-flex w-full items-center justify-center rounded-xl bg-[#E9DDC7] px-4 py-3 text-sm font-medium text-[#2a1e18] shadow-[0_10px_30px_rgba(233,221,199,0.12)] hover:-translate-y-px hover:shadow-[0_16px_40px_rgba(233,221,199,0.16)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 sm:w-1/2"
			>
				{isAnalyzing ? "Analyzing…" : "Analyze & Preview (1 Credit)"}
			</button>
		</div>
	);
}
