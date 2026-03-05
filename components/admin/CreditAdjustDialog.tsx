"use client";

import { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface CreditAdjustDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	targetUserId: string;
	targetEmail: string;
	currentCredits: number;
	onSuccess: () => void;
}

export function CreditAdjustDialog({
	open,
	onOpenChange,
	targetUserId,
	targetEmail,
	currentCredits,
	onSuccess,
}: CreditAdjustDialogProps) {
	const [delta, setDelta] = useState("");
	const [reason, setReason] = useState("");
	const [loading, setLoading] = useState(false);

	const numDelta = parseInt(delta) || 0;
	const newBalance = currentCredits + numDelta;
	const isNegativeResult = newBalance < 0;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!numDelta || !reason.trim()) return;

		// Confirmation for negative adjustments
		if (numDelta < 0) {
			if (
				!confirm(
					`This will REMOVE ${Math.abs(numDelta)} credits from ${targetEmail}. Continue?`,
				)
			) {
				return;
			}
		}

		setLoading(true);
		try {
			const res = await fetch("/api/admin/credits/adjust", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					targetUserId,
					delta: numDelta,
					reason: reason.trim(),
				}),
			});

			const data = await res.json();
			if (!res.ok) {
				throw new Error(
					typeof data.error === "string"
						? data.error
						: "Failed to adjust credits",
				);
			}

			toast.success(
				`Credits adjusted: ${numDelta > 0 ? "+" : ""}${numDelta}. New balance: ${data.newBalance}`,
			);
			onOpenChange(false);
			setDelta("");
			setReason("");
			onSuccess();
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to adjust credits",
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Adjust Credits</DialogTitle>
					<DialogDescription>
						Adjust credits for {targetEmail}. Current balance:{" "}
						<strong>{currentCredits}</strong>
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="delta">
							Amount (positive to add, negative to remove)
						</Label>
						<Input
							id="delta"
							type="number"
							placeholder="e.g. 10 or -5"
							value={delta}
							onChange={(e) => setDelta(e.target.value)}
							min={-500}
							max={500}
						/>
						{numDelta !== 0 && (
							<p
								className={`text-xs ${isNegativeResult ? "text-red-600" : "text-muted-foreground"}`}
							>
								New balance: {newBalance}
								{isNegativeResult &&
									" (negative — will be rejected)"}
							</p>
						)}
					</div>
					<div className="space-y-2">
						<Label htmlFor="reason">
							Reason (required, min 3 chars)
						</Label>
						<Textarea
							id="reason"
							placeholder="e.g. Compensation for failed generation"
							value={reason}
							onChange={(e) => setReason(e.target.value)}
							rows={2}
						/>
					</div>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={
								loading ||
								!numDelta ||
								reason.trim().length < 3 ||
								isNegativeResult
							}
						>
							{loading ? "Adjusting..." : "Confirm Adjustment"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
