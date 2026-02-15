"use client";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ViewResumeTextModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	resumeLabel: string;
	resumeText: string | null;
}

export function ViewResumeTextModal({
	open,
	onOpenChange,
	resumeLabel,
	resumeText,
}: ViewResumeTextModalProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl max-h-[80vh]">
				<DialogHeader>
					<DialogTitle>{resumeLabel}</DialogTitle>
					<DialogDescription>
						Extracted text from your resume
					</DialogDescription>
				</DialogHeader>

				<ScrollArea className="max-h-[60vh] rounded-md border p-4">
					{resumeText ? (
						<pre className="text-sm whitespace-pre-wrap font-mono text-muted-foreground">
							{resumeText}
						</pre>
					) : (
						<p className="text-sm text-muted-foreground italic">
							No extracted text available for this resume.
						</p>
					)}
				</ScrollArea>
			</DialogContent>
		</Dialog>
	);
}
