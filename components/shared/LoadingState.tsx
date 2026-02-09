import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface LoadingStateProps {
	title?: string;
	message?: string;
	className?: string;
}

export function LoadingState({
	title = "Loading",
	message = "Please wait a moment...",
	className,
}: LoadingStateProps) {
	return (
		<div
			className={cn(
				"flex flex-col items-center justify-center",
				"py-16 text-center",
				className,
			)}
		>
			<div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-border-visible bg-surface-inset">
				<Loader2
					size={28}
					className="animate-spin text-accent motion-reduce:animate-none"
				/>
			</div>
			<h3 className="mb-2 font-display text-lg font-semibold text-text-primary">
				{title}
			</h3>
			<p className="max-w-sm text-sm text-text-secondary">{message}</p>
			<div className="mt-5 w-full max-w-sm space-y-2">
				<Skeleton className="mx-auto h-3 w-5/6" />
				<Skeleton className="mx-auto h-3 w-3/4" />
				<Skeleton className="mx-auto h-3 w-2/3" />
			</div>
		</div>
	);
}
