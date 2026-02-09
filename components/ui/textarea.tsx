import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Textarea Component - The Résumé Atelier Design System
 *
 * Editorial-styled textarea matching the Input component.
 */
const Textarea = React.forwardRef<
	HTMLTextAreaElement,
	React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
	return (
		<textarea
			className={cn(
				// Base
				"flex w-full min-h-[120px] px-3 py-2",
				"text-sm text-text-primary placeholder:text-text-tertiary",
				"font-body leading-relaxed",
				// Surface: inset panel effect
				"bg-surface-inset",
				"border border-border-visible rounded-sm",
				// Focus: terracotta ring
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base",
				"focus-visible:border-accent",
				// Transitions
				"transition-colors duration-150 ease-out",
				// Resize
				"resize-y",
				// Disabled
				"disabled:cursor-not-allowed disabled:opacity-40",
				className,
			)}
			ref={ref}
			{...props}
		/>
	);
});
Textarea.displayName = "Textarea";

export { Textarea };
