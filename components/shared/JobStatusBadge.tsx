import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * JobStatusBadge - The Résumé Atelier Design System
 *
 * Semantic status indicator for generation jobs.
 * Maps job status to appropriate variant and icon.
 */

export type JobStatus = "pending" | "running" | "succeeded" | "failed";

interface JobStatusBadgeProps extends Omit<BadgeProps, "variant"> {
	status: JobStatus;
}

const statusConfig: Record<
	JobStatus,
	{
		variant: BadgeProps["variant"];
		label: string;
		icon: React.ComponentType<{ className?: string }>;
	}
> = {
	pending: {
		variant: "warning",
		label: "Pending",
		icon: Clock,
	},
	running: {
		variant: "warning",
		label: "Running",
		icon: Loader2,
	},
	succeeded: {
		variant: "success",
		label: "Completed",
		icon: CheckCircle2,
	},
	failed: {
		variant: "error",
		label: "Failed",
		icon: XCircle,
	},
};

export function JobStatusBadge({
	status,
	className,
	...props
}: JobStatusBadgeProps) {
	const config = statusConfig[status];
	const Icon = config.icon;

	return (
		<Badge
			variant={config.variant}
			className={cn("gap-1.5", className)}
			{...props}
		>
			<Icon
				className={cn("size-3", status === "running" && "animate-spin")}
			/>
			{config.label}
		</Badge>
	);
}
