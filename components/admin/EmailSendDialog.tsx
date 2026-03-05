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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { EMAIL_TEMPLATE_TYPES } from "@/lib/admin/schemas";

interface EmailSendDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	targetUserId: string;
	targetEmail: string;
}

const TEMPLATE_LABELS: Record<string, string> = {
	support_reply: "Support Reply",
	credits_granted: "Credits Granted",
	billing_help: "Billing Help",
	custom: "Custom",
};

export function EmailSendDialog({
	open,
	onOpenChange,
	targetUserId,
	targetEmail,
}: EmailSendDialogProps) {
	const [templateType, setTemplateType] = useState<string>("support_reply");
	const [subject, setSubject] = useState("");
	const [body, setBody] = useState("");
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		try {
			const res = await fetch("/api/admin/email/send", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					targetUserId,
					toEmail: targetEmail,
					templateType,
					subject: subject || undefined,
					body: body || undefined,
				}),
			});

			const data = await res.json();
			if (!res.ok) {
				throw new Error(
					typeof data.error === "string"
						? data.error
						: "Failed to send email",
				);
			}

			toast.success(`Email sent to ${targetEmail}`);
			onOpenChange(false);
			setSubject("");
			setBody("");
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to send email",
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>Send Email</DialogTitle>
					<DialogDescription>
						Send an email to {targetEmail}
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label>Template</Label>
						<Select
							value={templateType}
							onValueChange={setTemplateType}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{EMAIL_TEMPLATE_TYPES.map((t) => (
									<SelectItem key={t} value={t}>
										{TEMPLATE_LABELS[t] || t}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="space-y-2">
						<Label htmlFor="email-subject">
							Subject (optional — defaults to template subject)
						</Label>
						<Input
							id="email-subject"
							placeholder="Custom subject..."
							value={subject}
							onChange={(e) => setSubject(e.target.value)}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="email-body">Message Body</Label>
						<Textarea
							id="email-body"
							placeholder="Your message to the user..."
							value={body}
							onChange={(e) => setBody(e.target.value)}
							rows={4}
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
						<Button type="submit" disabled={loading}>
							{loading ? "Sending..." : "Send Email"}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
