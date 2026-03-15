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

interface DeleteApplicationDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
	isDeleting: boolean;
	company: string;
	role: string;
}

export function DeleteApplicationDialog({
	open,
	onOpenChange,
	onConfirm,
	isDeleting,
	company,
	role,
}: DeleteApplicationDialogProps) {
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Delete Application</AlertDialogTitle>
					<AlertDialogDescription>
						Are you sure you want to delete the application for{" "}
						<strong>{role}</strong> at <strong>{company}</strong>?
						This action cannot be undone.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isDeleting}>
						Cancel
					</AlertDialogCancel>
					<AlertDialogAction
						onClick={onConfirm}
						disabled={isDeleting}
						className="bg-error text-white hover:bg-error/90"
					>
						{isDeleting ? (
							<>
								<Loader2
									size={14}
									className="animate-spin mr-1"
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
