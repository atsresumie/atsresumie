"use client";

import { useState, useCallback } from "react";
import {
	MoreHorizontal,
	ArrowRight,
	Calendar,
	CheckCircle2,
	Pencil,
	ExternalLink,
	Trash2,
} from "lucide-react";
import {
	type JobApplication,
	type ApplicationStage,
	APPLICATION_STAGES,
	STAGE_LABELS,
} from "@/hooks/useJobApplications";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * Stage visual config — action labels for each stage.
 */
const STAGE_ACTION: Record<
	ApplicationStage,
	{ actionLabel: string }
> = {
	saved: { actionLabel: "View →" },
	applied: { actionLabel: "View →" },
	screening: { actionLabel: "View →" },
	interview: { actionLabel: "Prep →" },
	offer: { actionLabel: "Decide →" },
};

function getInitials(company: string): string {
	return company
		.split(" ")
		.map((w) => w[0])
		.join("")
		.slice(0, 2)
		.toUpperCase();
}

function formatDate(dateStr: string | null): string {
	if (!dateStr) return "";
	const d = new Date(dateStr);
	return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDateWithPrefix(dateStr: string | null, stage: ApplicationStage): string {
	if (!dateStr) return "";
	const formatted = formatDate(dateStr);
	if (stage === "saved") return `Saved on${formatted}`;
	return formatted;
}

function getInterviewLabel(dateStr: string | null): string | null {
	if (!dateStr) return null;
	const now = new Date();
	const interview = new Date(dateStr);
	const diffDays = Math.ceil(
		(interview.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
	);
	if (diffDays === 0) return "Today";
	if (diffDays === 1) return "Tomorrow";
	if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`;
	return null;
}

// ─── Board ───────────────────────────────────────────────────────────────────

interface ApplicationBoardProps {
	applications: JobApplication[];
	onView: (app: JobApplication) => void;
	onEdit: (app: JobApplication) => void;
	onDelete: (app: JobApplication) => void;
	onMove: (id: string, newStage: ApplicationStage) => void;
	onAdd: () => void;
}

export function ApplicationBoard({
	applications,
	onView,
	onEdit,
	onDelete,
	onMove,
	onAdd,
}: ApplicationBoardProps) {
	const [dragOverStage, setDragOverStage] = useState<ApplicationStage | null>(
		null,
	);

	const handleDragOver = useCallback(
		(e: React.DragEvent, stage: ApplicationStage) => {
			e.preventDefault();
			e.dataTransfer.dropEffect = "move";
			setDragOverStage(stage);
		},
		[],
	);

	const handleDragLeave = useCallback(() => {
		setDragOverStage(null);
	}, []);

	const handleDrop = useCallback(
		(e: React.DragEvent, targetStage: ApplicationStage) => {
			e.preventDefault();
			setDragOverStage(null);

			const appId = e.dataTransfer.getData("application/app-id");
			const sourceStage = e.dataTransfer.getData(
				"application/source-stage",
			);

			if (appId && sourceStage !== targetStage) {
				onMove(appId, targetStage);
			}
		},
		[onMove],
	);

	return (
		<div className="overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0">
			<div className="flex gap-4 min-w-[900px]">
				{APPLICATION_STAGES.map((stage) => {
					const stageApps = applications.filter(
						(app) => app.stage === stage,
					);
					const isDragOver = dragOverStage === stage;

					return (
						<div
							key={stage}
							className={`flex-1 min-w-[200px] rounded-xl border flex flex-col transition-colors duration-150 ${
								isDragOver
									? "bg-accent-muted/30 border-accent/30 ring-2 ring-accent/10"
									: "bg-surface-raised border-border-visible"
							}`}
							onDragOver={(e) => handleDragOver(e, stage)}
							onDragLeave={handleDragLeave}
							onDrop={(e) => handleDrop(e, stage)}
						>
							{/* Column header */}
							<div className="flex items-center justify-between px-4 py-3">
								<span className="text-sm font-semibold text-text-primary">
									{STAGE_LABELS[stage]}
								</span>
								<span className="text-sm font-semibold text-accent">
									{stageApps.length}
								</span>
							</div>

							{/* Cards */}
							<div className="px-3 pb-3 space-y-3 flex-1 min-h-[420px]">
								{stageApps.length === 0 && !isDragOver && (
									<div className="text-center py-10 text-xs text-text-tertiary">
										No applications
									</div>
								)}

								{isDragOver && stageApps.length === 0 && (
									<div className="text-center py-10 text-xs text-accent font-medium">
										Drop here
									</div>
								)}

								{stageApps.map((app) => (
									<ApplicationCard
										key={app.id}
										app={app}
										stage={stage}
										onView={onView}
										onEdit={onEdit}
										onDelete={onDelete}
										onMove={onMove}
									/>
								))}
							</div>

							{/* "Add +" button at bottom */}
							<div className="px-3 pb-3">
								<button
									onClick={onAdd}
									className="w-full py-2.5 text-sm text-text-secondary hover:text-accent transition-colors rounded-full border border-border-visible hover:border-accent/40 bg-surface-raised"
								>
									Add &nbsp;+
								</button>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}

// ─── Card ────────────────────────────────────────────────────────────────────

interface ApplicationCardProps {
	app: JobApplication;
	stage: ApplicationStage;
	onView: (app: JobApplication) => void;
	onEdit: (app: JobApplication) => void;
	onDelete: (app: JobApplication) => void;
	onMove: (id: string, newStage: ApplicationStage) => void;
}

function ApplicationCard({
	app,
	stage,
	onView,
	onEdit,
	onDelete,
	onMove,
}: ApplicationCardProps) {
	const initials = getInitials(app.company);
	const otherStages = APPLICATION_STAGES.filter((s) => s !== stage);
	const [isDragging, setIsDragging] = useState(false);
	const interviewLabel = stage === "interview" ? getInterviewLabel(app.interview_date) : null;
	const stageAction = STAGE_ACTION[stage];

	const handleDragStart = (e: React.DragEvent) => {
		e.dataTransfer.setData("application/app-id", app.id);
		e.dataTransfer.setData("application/source-stage", stage);
		e.dataTransfer.effectAllowed = "move";
		setIsDragging(true);
	};

	const handleDragEnd = () => {
		setIsDragging(false);
	};

	return (
		<div
			draggable
			onDragStart={handleDragStart}
			onDragEnd={handleDragEnd}
			onClick={() => onView(app)}
			className={`rounded-lg bg-surface-raised border border-border-visible p-3.5 hover:border-accent/30 transition-all group cursor-grab active:cursor-grabbing ${
				isDragging ? "opacity-40 scale-95 rotate-1" : ""
			}`}
			style={{ boxShadow: "var(--shadow-card)" }}
		>
			{/* Initials + role + company */}
			<div className="flex items-start gap-3 mb-2">
				<span
					className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold text-text-secondary flex-shrink-0 bg-surface-inset border border-border-subtle"
				>
					{initials}
				</span>
				<div className="min-w-0 flex-1">
					<p className="text-sm font-semibold text-text-primary truncate leading-tight">
						{app.role}
					</p>
					<p className="text-xs text-text-secondary truncate mt-0.5">
						{app.company}
						{app.location && ` · ${app.location}`}
					</p>
				</div>

				{/* Actions — appears on hover */}
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<button
							onClick={(e) => e.stopPropagation()}
							className="p-1 rounded hover:bg-surface-inset opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
						>
							<MoreHorizontal
								size={14}
								className="text-text-tertiary"
							/>
						</button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-40">
						<DropdownMenuItem onClick={() => onEdit(app)}>
							<Pencil size={12} className="mr-2" />
							Edit
						</DropdownMenuItem>
						{app.source_url && (
							<DropdownMenuItem asChild>
								<a
									href={app.source_url}
									target="_blank"
									rel="noopener noreferrer"
								>
									<ExternalLink size={12} className="mr-2" />
									Open posting
								</a>
							</DropdownMenuItem>
						)}
						<DropdownMenuSeparator />
						{otherStages.map((s) => (
							<DropdownMenuItem
								key={s}
								onClick={() => onMove(app.id, s)}
							>
								<ArrowRight size={12} className="mr-2" />
								Move to {STAGE_LABELS[s]}
							</DropdownMenuItem>
						))}
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onClick={() => onDelete(app)}
							className="text-destructive focus:text-destructive"
						>
							<Trash2 size={12} className="mr-2" />
							Delete
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>

			{/* Salary (for offer stage) */}
			{app.salary && (
				<div className="mb-2">
					<span className="text-base font-bold text-accent">
						{app.salary}
					</span>
				</div>
			)}

			{/* Interview date badge */}
			{interviewLabel && (
				<div className="flex items-center gap-1.5 mb-2">
					<span className="inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary bg-surface-inset px-2 py-1 rounded">
						<Calendar size={11} className="text-text-tertiary" />
						{interviewLabel}
					</span>
				</div>
			)}

			{/* Offer badge */}
			{stage === "offer" && (
				<div className="flex items-center gap-1.5 mb-2">
					<CheckCircle2 size={11} className="text-text-tertiary" />
					<span className="text-xs text-text-secondary">
						Offer received
					</span>
				</div>
			)}

			{/* Footer */}
			<div className="flex items-center justify-between mt-2.5 pt-2">
				<span className="text-xs text-text-tertiary">
					{formatDateWithPrefix(app.applied_at || app.created_at, stage)}
				</span>
				<button
					onClick={(e) => {
						e.stopPropagation();
						onView(app);
					}}
					className="text-xs font-semibold text-accent inline-flex items-center gap-0.5 hover:underline"
				>
					{stageAction.actionLabel}
				</button>
			</div>
		</div>
	);
}
