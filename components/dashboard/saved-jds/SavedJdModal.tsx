"use client";

import { useState, useEffect, useRef } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle } from "lucide-react";
import type {
	SavedJobDescription,
	CreateSavedJdInput,
	UpdateSavedJdInput,
} from "@/hooks/useSavedJds";

interface SavedJdModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	savedJd?: SavedJobDescription | null;
	onSave: (
		input: CreateSavedJdInput | UpdateSavedJdInput,
	) => Promise<boolean>;
	isSaving: boolean;
}

export function SavedJdModal({
	open,
	onOpenChange,
	savedJd,
	onSave,
	isSaving,
}: SavedJdModalProps) {
	const [label, setLabel] = useState("");
	const [company, setCompany] = useState("");
	const [sourceUrl, setSourceUrl] = useState("");
	const [jdText, setJdText] = useState("");
	const [error, setError] = useState<string | null>(null);
	const labelInputRef = useRef<HTMLInputElement>(null);

	const isEditing = !!savedJd;

	// Reset form when modal opens/closes or savedJd changes
	useEffect(() => {
		if (open) {
			if (savedJd) {
				setLabel(savedJd.label);
				setCompany(savedJd.company || "");
				setSourceUrl(savedJd.source_url || "");
				setJdText(savedJd.jd_text);
			} else {
				setLabel("");
				setCompany("");
				setSourceUrl("");
				setJdText("");
			}
			setError(null);
		}
	}, [open, savedJd]);

	// Focus label input when modal opens
	useEffect(() => {
		if (open && labelInputRef.current) {
			setTimeout(() => labelInputRef.current?.focus(), 100);
		}
	}, [open]);

	const isValid = label.trim().length > 0 && jdText.trim().length > 0;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!isValid || isSaving) return;

		setError(null);

		try {
			let success: boolean;
			if (isEditing && savedJd) {
				success = await onSave({
					id: savedJd.id,
					label: label.trim(),
					company: company.trim() || null,
					source_url: sourceUrl.trim() || null,
					jd_text: jdText.trim(),
				} as UpdateSavedJdInput);
			} else {
				const result = await onSave({
					label: label.trim(),
					company: company.trim() || undefined,
					source_url: sourceUrl.trim() || undefined,
					jd_text: jdText.trim(),
				} as CreateSavedJdInput);
				success = !!result;
			}

			if (success) {
				onOpenChange(false);
			} else {
				setError("Failed to save. Please try again.");
			}
		} catch (err) {
			console.error("Save error:", err);
			setError("An unexpected error occurred.");
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<form onSubmit={handleSubmit}>
					<DialogHeader>
						<DialogTitle>
							{isEditing ? "Edit Saved JD" : "New Saved JD"}
						</DialogTitle>
						<DialogDescription>
							{isEditing
								? "Update the details of your saved job description."
								: "Save a job description for quick reuse when generating tailored resumes."}
						</DialogDescription>
					</DialogHeader>

					<div className="mt-4 space-y-4">
						{/* Label */}
						<div className="space-y-2">
							<Label htmlFor="label">
								Label <span className="text-red-400">*</span>
							</Label>
							<Input
								ref={labelInputRef}
								id="label"
								value={label}
								onChange={(e) => setLabel(e.target.value)}
								placeholder="e.g., Chipotle Shift Leader"
								disabled={isSaving}
							/>
						</div>

						{/* Company */}
						<div className="space-y-2">
							<Label htmlFor="company">Company</Label>
							<Input
								id="company"
								value={company}
								onChange={(e) => setCompany(e.target.value)}
								placeholder="e.g., Chipotle Mexican Grill"
								disabled={isSaving}
							/>
						</div>

						{/* Source URL */}
						<div className="space-y-2">
							<Label htmlFor="sourceUrl">Source Link</Label>
							<Input
								id="sourceUrl"
								type="url"
								value={sourceUrl}
								onChange={(e) => setSourceUrl(e.target.value)}
								placeholder="https://careers.chipotle.com/..."
								disabled={isSaving}
							/>
						</div>

						{/* JD Text */}
						<div className="space-y-2">
							<Label htmlFor="jdText">
								Job Description{" "}
								<span className="text-red-400">*</span>
							</Label>
							<Textarea
								id="jdText"
								value={jdText}
								onChange={(e) => setJdText(e.target.value)}
								placeholder="Paste the full job description here..."
								rows={10}
								className="resize-none font-mono text-sm"
								disabled={isSaving}
							/>
							<p className="text-xs text-muted-foreground">
								{jdText.length.toLocaleString()} characters
							</p>
						</div>

						{/* Error */}
						{error && (
							<div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3">
								<AlertCircle
									size={16}
									className="text-red-400"
								/>
								<p className="text-sm text-red-400">{error}</p>
							</div>
						)}
					</div>

					<DialogFooter className="mt-6">
						<Button
							type="button"
							variant="ghost"
							onClick={() => onOpenChange(false)}
							disabled={isSaving}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={!isValid || isSaving}>
							{isSaving ? (
								<>
									<Loader2
										size={16}
										className="mr-2 animate-spin"
									/>
									Saving...
								</>
							) : isEditing ? (
								"Save Changes"
							) : (
								"Save JD"
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
