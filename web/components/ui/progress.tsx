import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

/**
 * Progress Component - The Résumé Atelier Design System
 *
 * Terracotta-accented progress bar with smooth animation.
 */
const Progress = React.forwardRef<
	React.ElementRef<typeof ProgressPrimitive.Root>,
	React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
	<ProgressPrimitive.Root
		ref={ref}
		className={cn(
			"relative h-2 w-full overflow-hidden rounded-full",
			"bg-surface-inset",
			className,
		)}
		{...props}
	>
		<ProgressPrimitive.Indicator
			className={cn(
				"h-full w-full flex-1 rounded-full",
				"bg-accent",
				"transition-transform duration-300 ease-out",
			)}
			style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
		/>
	</ProgressPrimitive.Root>
));
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
