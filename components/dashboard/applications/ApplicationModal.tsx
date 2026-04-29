"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import {
	type JobApplication,
	type ApplicationStage,
	type CreateApplicationInput,
	type UpdateApplicationInput,
	APPLICATION_STAGES,
	STAGE_LABELS,
} from "@/hooks/useJobApplications";
import { Loader2 } from "lucide-react";

interface ApplicationModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	application: JobApplication | null;
	onSave: (
		input: CreateApplicationInput | UpdateApplicationInput,
	) => Promise<boolean>;
	isSaving: boolean;
}

export function ApplicationModal({
	open,
	onOpenChange,
	application,
	onSave,
	isSaving,
}: ApplicationModalProps) {
	const isEditing = !!application;

	const [company, setCompany] = useState("");
	const [role, setRole] = useState("");
	const [location, setLocation] = useState("");
	const [salary, setSalary] = useState("");
	const [sourceUrl, setSourceUrl] = useState("");
	const [stage, setStage] = useState<ApplicationStage>("saved");
	const [appliedAt, setAppliedAt] = useState("");
	const [interviewDate, setInterviewDate] = useState("");
	const [notes, setNotes] = useState("");

	// Populate form when editing
	useEffect(() => {
		if (application) {
			setCompany(application.company);
			setRole(application.role);
			setLocation(application.location || "");
			setSalary(application.salary || "");
			setSourceUrl(application.source_url || "");
			setStage(application.stage);
			setAppliedAt(
				application.applied_at
					? application.applied_at.split("T")[0]
					: "",
			);
			setInterviewDate(
				application.interview_date
					? application.interview_date.split("T")[0]
					: "",
			);
			setNotes(application.notes || "");
		} else {
			setCompany("");
			setRole("");
			setLocation("");
			setSalary("");
			setSourceUrl("");
			setStage("saved");
			setAppliedAt("");
			setInterviewDate("");
			setNotes("");
		}
	}, [application, open]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!company.trim() || !role.trim()) return;

		const baseData = {
			company: company.trim(),
			role: role.trim(),
			location: location.trim() || undefined,
			salary: salary.trim() || undefined,
			source_url: sourceUrl.trim() || undefined,
			stage,
			applied_at: appliedAt || undefined,
			interview_date: interviewDate || undefined,
			notes: notes.trim() || undefined,
		};

		let success: boolean;
		if (isEditing) {
			success = await onSave({
				id: application.id,
				...baseData,
				location: baseData.location || null,
				salary: baseData.salary || null,
				source_url: baseData.source_url || null,
				applied_at: baseData.applied_at || null,
				interview_date: baseData.interview_date || null,
				notes: baseData.notes || null,
			} as UpdateApplicationInput);
		} else {
			success = await onSave(baseData as CreateApplicationInput);
		}

		if (success) {
			onOpenChange(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>
						{isEditing ? "Edit Application" : "Add Application"}
					</DialogTitle>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					{/* Company + Role */}
					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="text-xs font-medium text-text-secondary mb-1.5 block">
								Company *
							</label>
							<Input
								value={company}
								onChange={(e) => setCompany(e.target.value)}
								placeholder="e.g. Stripe"
								required
							/>
						</div>
						<div>
							<label className="text-xs font-medium text-text-secondary mb-1.5 block">
								Role *
							</label>
							<Input
								value={role}
								onChange={(e) => setRole(e.target.value)}
								placeholder="e.g. Frontend Engineer"
								required
							/>
						</div>
					</div>

					{/* Location + Salary */}
					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="text-xs font-medium text-text-secondary mb-1.5 block">
								Location
							</label>
							<Input
								value={location}
								onChange={(e) => setLocation(e.target.value)}
								placeholder="e.g. Remote"
							/>
						</div>
						<div>
							<label className="text-xs font-medium text-text-secondary mb-1.5 block">
								Salary
							</label>
							<Input
								value={salary}
								onChange={(e) => setSalary(e.target.value)}
								placeholder="e.g. $150K / yr"
							/>
						</div>
					</div>

					{/* Stage */}
					<div>
						<label className="text-xs font-medium text-text-secondary mb-1.5 block">
							Stage
						</label>
						<select
							value={stage}
							onChange={(e) =>
								setStage(e.target.value as ApplicationStage)
							}
							className="w-full h-10 px-3 rounded-md border border-border-visible bg-surface-base text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
						>
							{APPLICATION_STAGES.map((s) => (
								<option key={s} value={s}>
									{STAGE_LABELS[s]}
								</option>
							))}
						</select>
					</div>

					{/* Dates */}
					<div className="grid grid-cols-2 gap-3">
						<div>
							<label className="text-xs font-medium text-text-secondary mb-1.5 block">
								Applied Date
							</label>
							<Input
								type="date"
								value={appliedAt}
								onChange={(e) => setAppliedAt(e.target.value)}
							/>
						</div>
						<div>
							<label className="text-xs font-medium text-text-secondary mb-1.5 block">
								Interview Date
							</label>
							<Input
								type="date"
								value={interviewDate}
								onChange={(e) =>
									setInterviewDate(e.target.value)
								}
							/>
						</div>
					</div>

					{/* Source URL */}
					<div>
						<label className="text-xs font-medium text-text-secondary mb-1.5 block">
							Job Posting URL
						</label>
						<Input
							value={sourceUrl}
							onChange={(e) => setSourceUrl(e.target.value)}
							placeholder="https://..."
							type="url"
						/>
					</div>

					{/* Notes */}
					<div>
						<label className="text-xs font-medium text-text-secondary mb-1.5 block">
							Notes
						</label>
						<textarea
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							placeholder="Any notes about this application..."
							rows={3}
							className="w-full px-3 py-2 rounded-md border border-border-visible bg-surface-base text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent resize-none"
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
						<Button type="submit" disabled={isSaving}>
							{isSaving ? (
								<>
									<Loader2
										size={14}
										className="animate-spin mr-1"
									/>
									Saving...
								</>
							) : isEditing ? (
								"Update"
							) : (
								"Add Application"
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
