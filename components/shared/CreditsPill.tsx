import { CreditCard, Coins } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * CreditsPill - The Résumé Atelier Design System
 *
 * Credit balance indicator with color-coded states.
 */

interface CreditsPillProps {
	credits: number | null;
	isLoading?: boolean;
	hasError?: boolean;
	className?: string;
}

export function CreditsPill({
	credits,
	isLoading = false,
	hasError = false,
	className,
}: CreditsPillProps) {
	// Determine display value
	const displayValue = isLoading ? "…" : hasError ? "—" : credits;

	// Determine color based on credit level
	const getColorClasses = () => {
		if (isLoading || hasError) {
			return "text-text-secondary";
		}
		if (credits === 0) {
			return "text-error";
		}
		if (credits !== null && credits <= 3) {
			return "text-warning";
		}
		return "text-text-primary";
	};

	return (
		<div
			className={cn(
				// Base styling
				"inline-flex items-center gap-2",
				"px-3 py-1.5",
				"rounded-full",
				"bg-surface-inset",
				"border border-border-subtle",
				"transition-colors duration-150",
				className,
			)}
		>
			<Coins size={14} className="text-text-tertiary" />
			<span
				className={cn(
					"text-sm font-medium tabular-nums",
					getColorClasses(),
				)}
			>
				{displayValue}
			</span>
		</div>
	);
}
