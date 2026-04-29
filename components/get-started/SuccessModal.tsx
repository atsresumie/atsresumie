"use client";

import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle } from "lucide-react";
import Link from "next/link";

interface SuccessModalProps {
	open: boolean;
	pdfUrl: string | null;
	onCreateAnother: () => void;
}

export default function SuccessModal({
	open,
	pdfUrl,
	onCreateAnother,
}: SuccessModalProps) {
	return (
		<Dialog open={open}>
			<DialogContent className="sm:max-w-md bg-surface-raised border-border-visible text-text-primary">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 text-xl">
						<CheckCircle className="h-6 w-6 text-success" />
						Resume Generated!
					</DialogTitle>
				</DialogHeader>

				<div className="py-4">
					<p className="text-text-secondary">
						Your ATS-optimized resume has been created successfully.
					</p>

					{pdfUrl && (
						<a
							href={pdfUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="mt-4 block w-full rounded-xl bg-cta py-3 text-center text-sm font-medium text-cta-foreground hover:bg-cta-hover transition-colors"
						>
							Download PDF
						</a>
					)}
				</div>

				<div className="flex gap-3 pt-2">
					<button
						onClick={onCreateAnother}
						className="flex-1 rounded-xl border border-border-visible bg-surface-base py-3 text-sm font-medium hover:bg-surface-inset transition-colors"
					>
						Create Another
					</button>
					<Link
						href="/dashboard"
						className="flex-1 rounded-xl border border-border-visible bg-surface-base py-3 text-center text-sm font-medium hover:bg-surface-inset transition-colors"
					>
						View Dashboard
					</Link>
				</div>
			</DialogContent>
		</Dialog>
	);
}
