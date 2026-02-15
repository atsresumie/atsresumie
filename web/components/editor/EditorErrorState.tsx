"use client";

import { AlertCircle, ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface EditorErrorStateProps {
	error: string;
	onRetry?: () => void;
}

/**
 * Error state for the Resume Canvas Editor
 */
export function EditorErrorState({ error, onRetry }: EditorErrorStateProps) {
	return (
		<div className="flex h-screen flex-col bg-surface-base">
			{/* Top Bar */}
			<header className="flex h-14 shrink-0 items-center border-b border-border-subtle bg-surface-raised px-4">
				<Link href="/dashboard/generations">
					<Button variant="ghost" size="sm" className="gap-2">
						<ArrowLeft size={16} />
						Back to Generations
					</Button>
				</Link>
			</header>

			{/* Error Content */}
			<div className="flex flex-1 flex-col items-center justify-center p-8">
				<div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-error-muted">
					<AlertCircle size={32} className="text-error" />
				</div>
				<h2 className="mb-2 text-lg font-semibold text-text-primary">
					Unable to Load Editor
				</h2>
				<p className="mb-6 max-w-md text-center text-text-secondary">
					{error}
				</p>
				<div className="flex gap-3">
					{onRetry && (
						<Button
							variant="outline"
							onClick={onRetry}
							className="gap-2"
						>
							<RefreshCw size={16} />
							Retry
						</Button>
					)}
					<Link href="/dashboard/generations">
						<Button>View All Generations</Button>
					</Link>
				</div>
			</div>
		</div>
	);
}
