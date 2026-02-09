import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Button Component - The Résumé Atelier Design System
 *
 * Editorial-inspired buttons with minimal radii and refined interactions.
 * Uses terracotta accent for primary actions.
 */
const buttonVariants = cva(
	// Base styles: editorial, minimal, accessible
	[
		"inline-flex items-center justify-center gap-2",
		"whitespace-nowrap font-medium",
		"transition-all duration-150 ease-out",
		// Focus: 2px terracotta ring with offset
		"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base",
		// Disabled
		"disabled:pointer-events-none disabled:opacity-40",
		// Icons
		"[&_svg]:pointer-events-none [&_svg]:shrink-0",
	].join(" "),
	{
		variants: {
			variant: {
				// Primary: Terracotta accent (the "wax seal" button)
				primary: [
					"bg-accent text-accent-foreground",
					"hover:bg-accent-hover",
					"active:scale-[0.98]",
				].join(" "),

				// Default: Alias for primary (backwards compatibility)
				default: [
					"bg-accent text-accent-foreground",
					"hover:bg-accent-hover",
					"active:scale-[0.98]",
				].join(" "),

				// Secondary: Raised surface
				secondary: [
					"bg-surface-raised text-text-primary",
					"border border-border-visible",
					"hover:bg-surface-overlay hover:border-border-focus",
				].join(" "),

				// Outline: Transparent with border
				outline: [
					"bg-transparent text-text-primary",
					"border border-border-visible",
					"hover:bg-surface-raised hover:text-text-primary",
				].join(" "),

				// Ghost: Minimal, no background
				ghost: [
					"bg-transparent text-text-secondary",
					"hover:bg-surface-raised hover:text-text-primary",
				].join(" "),

				// Destructive: Error state
				destructive: [
					"bg-error text-white",
					"hover:bg-error/90",
					"active:scale-[0.98]",
				].join(" "),

				// Link: Underline style
				link: [
					"bg-transparent text-accent underline-offset-4",
					"hover:underline",
					"p-0 h-auto",
				].join(" "),
			},
			size: {
				sm: "h-8 px-3 text-sm rounded-sm [&_svg]:size-3.5",
				default: "h-10 px-4 text-sm rounded-sm [&_svg]:size-4",
				lg: "h-12 px-6 text-base rounded-sm [&_svg]:size-5",
				xl: "h-14 px-8 text-lg rounded-sm [&_svg]:size-5",
				icon: "h-10 w-10 rounded-sm [&_svg]:size-5",
				"icon-sm": "h-8 w-8 rounded-sm [&_svg]:size-4",
			},
		},
		defaultVariants: {
			variant: "primary",
			size: "default",
		},
	},
);

export interface ButtonProps
	extends
		React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof buttonVariants> {
	asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, variant, size, asChild = false, ...props }, ref) => {
		const Comp = asChild ? Slot : "button";
		return (
			<Comp
				className={cn(buttonVariants({ variant, size, className }))}
				ref={ref}
				{...props}
			/>
		);
	},
);
Button.displayName = "Button";

export { Button, buttonVariants };
