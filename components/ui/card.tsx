import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Card Component - The Résumé Atelier Design System
 *
 * Editorial-styled cards with minimal radii and optional inset variant.
 * No rounded corners on outer edges = editorial, not SaaS.
 */

const cardVariants = cva(
	// Base: minimal radius, border
	"border border-border-visible",
	{
		variants: {
			variant: {
				// Default: raised surface
				default: "bg-surface-raised",
				// Inset: pressed panel effect (signature motif)
				inset: "bg-surface-inset border-border-subtle shadow-[inset_0_1px_0_0_hsl(30_6%_4%)]",
				// Ghost: no background
				ghost: "bg-transparent border-transparent",
			},
			padding: {
				none: "",
				sm: "p-4",
				default: "p-6",
				lg: "p-8",
			},
			radius: {
				none: "rounded-none",
				sm: "rounded-sm",
			},
		},
		defaultVariants: {
			variant: "default",
			padding: "none",
			radius: "sm",
		},
	},
);

export interface CardProps
	extends
		React.HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
	({ className, variant, padding, radius, ...props }, ref) => (
		<div
			ref={ref}
			className={cn(
				cardVariants({ variant, padding, radius }),
				className,
			)}
			{...props}
		/>
	),
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn(
			"flex flex-col gap-1.5 p-6",
			"border-b border-border-subtle",
			className,
		)}
		{...props}
	/>
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
	HTMLParagraphElement,
	React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
	<h3
		ref={ref}
		className={cn(
			"text-lg font-semibold font-display",
			"text-text-primary",
			"leading-none tracking-tight",
			className,
		)}
		{...props}
	/>
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
	HTMLParagraphElement,
	React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
	<p
		ref={ref}
		className={cn("text-sm text-text-secondary", className)}
		{...props}
	/>
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div ref={ref} className={cn("p-6", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
	HTMLDivElement,
	React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
	<div
		ref={ref}
		className={cn(
			"flex items-center gap-2 p-6",
			"border-t border-border-subtle",
			className,
		)}
		{...props}
	/>
));
CardFooter.displayName = "CardFooter";

export {
	Card,
	CardHeader,
	CardFooter,
	CardTitle,
	CardDescription,
	CardContent,
	cardVariants,
};
