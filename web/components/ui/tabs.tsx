import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

/**
 * Tabs Component - The Résumé Atelier Design System
 *
 * Editorial-styled tabs with underline indicator instead of pills.
 */

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
	React.ElementRef<typeof TabsPrimitive.List>,
	React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
	<TabsPrimitive.List
		ref={ref}
		className={cn(
			// Base: horizontal layout with bottom border
			"inline-flex items-center gap-1",
			"border-b border-border-subtle",
			className,
		)}
		{...props}
	/>
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
	React.ElementRef<typeof TabsPrimitive.Trigger>,
	React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
	<TabsPrimitive.Trigger
		ref={ref}
		className={cn(
			// Base
			"inline-flex items-center justify-center",
			"whitespace-nowrap px-4 py-2.5",
			"text-sm font-medium",
			"transition-colors duration-150",
			// Underline indicator (the editorial touch)
			"relative",
			"text-text-secondary",
			"hover:text-text-primary",
			// Active state: terracotta underline
			"data-[state=active]:text-text-primary",
			"after:absolute after:inset-x-0 after:bottom-[-1px] after:h-0.5",
			"after:bg-transparent after:transition-colors after:duration-150",
			"data-[state=active]:after:bg-accent",
			// Focus
			"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base",
			// Disabled
			"disabled:pointer-events-none disabled:opacity-40",
			className,
		)}
		{...props}
	/>
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
	React.ElementRef<typeof TabsPrimitive.Content>,
	React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
	<TabsPrimitive.Content
		ref={ref}
		className={cn(
			"mt-4",
			"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base",
			className,
		)}
		{...props}
	/>
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
