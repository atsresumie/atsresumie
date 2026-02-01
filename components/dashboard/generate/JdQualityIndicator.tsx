"use client";

import { cn } from "@/lib/utils";

interface JdQualityIndicatorProps {
	characterCount: number;
}

const MIN_CHARS = 500;

/**
 * Simple JD quality indicator based on character count.
 */
export function JdQualityIndicator({
	characterCount,
}: JdQualityIndicatorProps) {
	const isGood = characterCount >= MIN_CHARS;

	return (
		<div
			className={cn(
				"flex items-center gap-2 text-sm",
				isGood ? "text-emerald-400" : "text-amber-400",
			)}
		>
			<span
				className={cn(
					"h-2 w-2 rounded-full",
					isGood ? "bg-emerald-400" : "bg-amber-400",
				)}
			/>
			{isGood ? (
				<span>Looks good</span>
			) : (
				<span>Too short — add responsibilities + requirements</span>
			)}
		</div>
	);
}
