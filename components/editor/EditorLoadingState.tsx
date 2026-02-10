"use client";

import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading skeleton for the Resume Canvas Editor
 */
export function EditorLoadingState() {
	return (
		<div className="flex h-screen flex-col bg-surface-base">
			{/* Top Bar Skeleton */}
			<header className="flex h-14 shrink-0 items-center justify-between border-b border-border-subtle bg-surface-raised px-4">
				<div className="flex items-center gap-4">
					<Skeleton className="h-8 w-20" />
					<div className="h-5 w-px bg-border-subtle" />
					<Skeleton className="h-8 w-48" />
				</div>
				<div className="flex items-center gap-2">
					<Skeleton className="h-8 w-20" />
					<Skeleton className="h-8 w-32" />
				</div>
			</header>

			{/* Main Content Skeleton */}
			<div className="flex flex-1 overflow-hidden">
				{/* Left Panel */}
				<aside className="w-72 shrink-0 border-r border-border-subtle bg-surface-raised p-4">
					<Skeleton className="mb-6 h-5 w-24" />
					<div className="space-y-4">
						<Skeleton className="h-10 w-full" />
						<Skeleton className="h-10 w-full" />
						<Skeleton className="h-10 w-full" />
						<Skeleton className="h-10 w-full" />
					</div>
					<div className="mt-6 h-px bg-border-subtle" />
					<div className="mt-6 space-y-4">
						<Skeleton className="h-10 w-full" />
						<Skeleton className="h-20 w-full" />
						<Skeleton className="h-10 w-full" />
					</div>
				</aside>

				{/* Right Panel */}
				<main className="flex flex-1 items-center justify-center bg-surface-inset p-6">
					<Skeleton className="h-[800px] w-[600px] rounded shadow-sm" />
				</main>
			</div>
		</div>
	);
}
