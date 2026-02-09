import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";

/**
 * EmptyState - The Résumé Atelier Design System
 *
 * Consistent empty state component for lists and tables.
 * Editorial styling with optional action button.
 */

interface EmptyStateProps {
	icon?: React.ReactNode;
	title: string;
	description?: string;
	action?: {
		label: string;
		href?: string;
		onClick?: () => void;
	};
	className?: string;
}

export function EmptyState({
	icon,
	title,
	description,
	action,
	className,
}: EmptyStateProps) {
	return (
		<div
			className={cn(
				"flex flex-col items-center justify-center",
				"py-16 text-center",
				className,
			)}
		>
			{icon && (
				<div
					className={cn(
						"mb-4",
						"flex h-16 w-16 items-center justify-center",
						"rounded-full",
						"bg-surface-inset",
						"border border-border-subtle",
						"text-text-tertiary",
					)}
				>
					{icon}
				</div>
			)}

			<h3 className="mb-2 text-lg font-semibold font-display text-text-primary">
				{title}
			</h3>

			{description && (
				<p className="mb-6 max-w-sm text-sm text-text-secondary">
					{description}
				</p>
			)}

			{action &&
				(action.href ? (
					<Link href={action.href}>
						<Button variant="primary" size="default">
							{action.label}
						</Button>
					</Link>
				) : (
					<Button
						variant="primary"
						size="default"
						onClick={action.onClick}
					>
						{action.label}
					</Button>
				))}
		</div>
	);
}
