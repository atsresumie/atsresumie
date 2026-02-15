import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

/**
 * ErrorState - The Résumé Atelier Design System
 *
 * Consistent error state component with retry action.
 */

interface ErrorStateProps {
	title?: string;
	message?: string;
	onRetry?: () => void;
	className?: string;
}

export function ErrorState({
	title = "Something went wrong",
	message = "An error occurred. Please try again.",
	onRetry,
	className,
}: ErrorStateProps) {
	return (
		<div
			className={cn(
				"flex flex-col items-center justify-center",
				"py-16 text-center",
				className,
			)}
		>
			<div
				className={cn(
					"mb-4",
					"flex h-16 w-16 items-center justify-center",
					"rounded-full",
					"bg-error-muted",
					"border border-error/20",
				)}
			>
				<AlertCircle size={32} className="text-error" />
			</div>

			<h3 className="mb-2 text-lg font-semibold font-display text-text-primary">
				{title}
			</h3>

			<p className="mb-6 max-w-sm text-sm text-text-secondary">
				{message}
			</p>

			{onRetry && (
				<Button variant="secondary" size="default" onClick={onRetry}>
					<RefreshCw size={16} />
					Try again
				</Button>
			)}
		</div>
	);
}
