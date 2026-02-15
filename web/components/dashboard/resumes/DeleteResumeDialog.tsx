"use client";

import { Loader2 } from "lucide-react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteResumeDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	resumeLabel: string;
	isDefault: boolean;
	isDeleting: boolean;
	onConfirm: () => void;
}

export function DeleteResumeDialog({
	open,
	onOpenChange,
	resumeLabel,
	isDefault,
	isDeleting,
	onConfirm,
}: DeleteResumeDialogProps) {
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete this resume?</AlertDialogTitle>
					<AlertDialogDescription asChild>
						<div className="space-y-2">
							<p>
								This will permanently delete &ldquo;
								{resumeLabel}&rdquo;. This action cannot be
								undone.
							</p>
							{isDefault && (
								<p className="text-amber-500 font-medium">
									⚠️ This is your default resume. After
									deletion, the newest remaining resume will
									become your default.
								</p>
							)}
						</div>
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isDeleting}>
						Cancel
					</AlertDialogCancel>
					<AlertDialogAction
						onClick={(e) => {
							e.preventDefault();
							onConfirm();
						}}
						disabled={isDeleting}
						className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
					>
						{isDeleting ? (
							<>
								<Loader2
									size={16}
									className="mr-2 animate-spin"
								/>
								Deleting...
							</>
						) : (
							"Delete"
						)}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
