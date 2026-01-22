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
			<DialogContent className="sm:max-w-md bg-[#1a120e] border-[rgba(233,221,199,0.15)] text-[#E9DDC7]">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 text-xl">
						<CheckCircle className="h-6 w-6 text-green-400" />
						Resume Generated!
					</DialogTitle>
				</DialogHeader>

				<div className="py-4">
					<p className="text-[rgba(233,221,199,0.75)]">
						Your ATS-optimized resume has been created successfully.
					</p>

					{pdfUrl && (
						<a
							href={pdfUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="mt-4 block w-full rounded-xl bg-[#C8B08A] py-3 text-center text-sm font-medium text-[#1a120e] hover:bg-[#d4c4a8] transition-colors"
						>
							Download PDF
						</a>
					)}
				</div>

				<div className="flex gap-3 pt-2">
					<button
						onClick={onCreateAnother}
						className="flex-1 rounded-xl border border-[rgba(233,221,199,0.15)] bg-[rgba(233,221,199,0.06)] py-3 text-sm font-medium hover:bg-[rgba(233,221,199,0.12)] transition-colors"
					>
						Create Another
					</button>
					<Link
						href="/dashboard"
						className="flex-1 rounded-xl border border-[rgba(233,221,199,0.15)] bg-[rgba(233,221,199,0.06)] py-3 text-center text-sm font-medium hover:bg-[rgba(233,221,199,0.12)] transition-colors"
					>
						View Dashboard
					</Link>
				</div>
			</DialogContent>
		</Dialog>
	);
}
