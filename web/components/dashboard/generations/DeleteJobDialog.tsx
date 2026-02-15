"use client";

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
import { Loader2 } from "lucide-react";

interface DeleteJobDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
	isDeleting: boolean;
	jobLabel: string;
}

export function DeleteJobDialog({
	open,
	onOpenChange,
	onConfirm,
	isDeleting,
	jobLabel,
}: DeleteJobDialogProps) {
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete this generation?</AlertDialogTitle>
					<AlertDialogDescription>
						This will permanently delete &quot;{jobLabel}&quot;.
						This action cannot be undone.
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
