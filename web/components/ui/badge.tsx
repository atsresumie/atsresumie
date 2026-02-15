import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Badge Component - The Résumé Atelier Design System
 *
 * Pill-shaped status indicators with semantic colors.
 * Used for job status, credits, and labels.
 */
const badgeVariants = cva(
	// Base: pill shape, inline-flex
	[
		"inline-flex items-center justify-center gap-1.5",
		"px-2.5 py-0.5",
		"text-xs font-medium",
		"rounded-full",
		"transition-colors duration-150 ease-out",
		"[&_svg]:size-3",
	].join(" "),
	{
		variants: {
			variant: {
				// Default: Subtle background
				default: [
					"bg-surface-raised text-text-secondary",
					"border border-border-subtle",
				].join(" "),

				// Primary: Terracotta accent
				primary: [
					"bg-accent-muted text-accent",
					"border border-accent/20",
				].join(" "),

				// Secondary: Similar to default (backwards compatibility)
				secondary: [
					"bg-surface-raised text-text-secondary",
					"border border-border-subtle",
				].join(" "),

				// Success: Sage green (job succeeded)
				success: [
					"bg-success-muted text-success",
					"border border-success/20",
				].join(" "),

				// Warning: Golden yellow (job running/pending)
				warning: [
					"bg-warning-muted text-warning",
					"border border-warning/20",
				].join(" "),

				// Error: Muted red (job failed)
				error: [
					"bg-error-muted text-error",
					"border border-error/20",
				].join(" "),

				// Destructive: Alias for error (backwards compatibility)
				destructive: [
					"bg-error-muted text-error",
					"border border-error/20",
				].join(" "),

				// Outline: Border only
				outline: [
					"bg-transparent text-text-secondary",
					"border border-border-visible",
				].join(" "),

				// Solid: High contrast
				solid: [
					"bg-text-primary text-surface-base",
					"border border-transparent",
				].join(" "),
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

export interface BadgeProps
	extends
		React.HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
	return (
		<div className={cn(badgeVariants({ variant }), className)} {...props} />
	);
}

export { Badge, badgeVariants };
