import { cn } from "@/lib/utils";

/**
 * Skeleton Component - The Résumé Atelier Design System
 *
 * Loading placeholder with warm tones and subtle wave animation.
 */
function Skeleton({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn(
				"rounded-sm",
				"bg-gradient-to-r from-surface-raised via-surface-inset to-surface-raised",
				"bg-[length:200%_100%]",
				"animate-[skeleton-wave_1.5s_ease-in-out_infinite]",
				className,
			)}
			{...props}
		/>
	);
}

export { Skeleton };
