"use client";

import Link from "next/link";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickActionCardProps {
	icon: LucideIcon;
	title: string;
	description: string;
	href: string;
	className?: string;
}

export function QuickActionCard({
	icon: Icon,
	title,
	description,
	href,
	className,
}: QuickActionCardProps) {
	return (
		<Link
			href={href}
			className={cn(
				"group relative flex flex-col gap-3 rounded-xl border border-border/50 bg-card/50 p-5 transition-all duration-200",
				"hover:border-border hover:bg-card/80 hover:shadow-lg",
				"focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
				className,
			)}
		>
			{/* Icon */}
			<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/50 text-muted-foreground transition-colors group-hover:bg-muted group-hover:text-foreground">
				<Icon size={20} />
			</div>

			{/* Content */}
			<div className="space-y-1">
				<h3 className="font-medium text-foreground">{title}</h3>
				<p className="text-sm text-muted-foreground">{description}</p>
			</div>
		</Link>
	);
}
