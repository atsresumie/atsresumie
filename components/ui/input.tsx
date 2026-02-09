import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Input Component - The Résumé Atelier Design System
 *
 * Editorial-styled input with inset appearance and terracotta focus ring.
 */
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
	({ className, type, ...props }, ref) => {
		return (
			<input
				type={type}
				className={cn(
					// Base
					"flex w-full px-3 py-2",
					"text-sm text-text-primary placeholder:text-text-tertiary",
					"font-body",
					// Surface: inset panel effect
					"bg-surface-inset",
					"border border-border-visible rounded-sm",
					// Focus: terracotta ring
					"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base",
					"focus-visible:border-accent",
					// Transitions
					"transition-colors duration-150 ease-out",
					// File input styling
					"file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-text-primary",
					// Disabled
					"disabled:cursor-not-allowed disabled:opacity-40",
					// Height
					"h-10",
					className,
				)}
				ref={ref}
				{...props}
			/>
		);
	},
);
Input.displayName = "Input";

export { Input };
