"use client";

import { useState, useCallback } from "react";
import {
	Bookmark,
	Send,
	ScanSearch,
	MessageSquare,
	Trophy,
	MoreHorizontal,
	ArrowRight,
	Calendar,
	DollarSign,
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
 * Stage visual config — mirrors the landing page JobTracker.
 */
const STAGE_CONFIG: Record<
	ApplicationStage,
	{
		icon: typeof Bookmark;
		accentClass: string;
		headerBg: string;
		actionColor: string;
		actionLabel: string;
	}
> = {
	saved: {
		icon: Bookmark,
		accentClass: "text-muted-foreground",
		headerBg: "bg-muted/30",
		actionColor: "text-primary",
		actionLabel: "Apply →",
	},
	applied: {
		icon: Send,
		accentClass: "text-blue-500",
		headerBg: "bg-blue-50 dark:bg-blue-500/10",
		actionColor: "text-muted-foreground",
		actionLabel: "View",
	},
	screening: {
		icon: ScanSearch,
		accentClass: "text-muted-foreground",
		headerBg: "bg-muted/20",
		actionColor: "text-muted-foreground",
		actionLabel: "View",
	},
	interview: {
		icon: MessageSquare,
		accentClass: "text-amber-500",
		headerBg: "bg-amber-50 dark:bg-amber-500/10",
		actionColor: "text-amber-500",
		actionLabel: "Prep →",
	},
	offer: {
		icon: Trophy,
		accentClass: "text-green-500",
		headerBg: "bg-green-50 dark:bg-green-500/10",
		actionColor: "text-green-500",
		actionLabel: "Decide",
	},
};

const INITIALS_BG = [
	"bg-primary/10",
	"bg-blue-500/10",
	"bg-green-500/10",
	"bg-amber-500/10",
	"bg-purple-500/10",
	"bg-rose-500/10",
];

function getInitials(company: string): string {
	return company
		.split(" ")
		.map((w) => w[0])
		.join("")
		.slice(0, 2)
		.toUpperCase();
}

function getInitialsBg(company: string): string {
	let hash = 0;
	for (let i = 0; i < company.length; i++) {
		hash = company.charCodeAt(i) + ((hash << 5) - hash);
	}
	return INITIALS_BG[Math.abs(hash) % INITIALS_BG.length];
}

function formatDate(dateStr: string | null): string {
	if (!dateStr) return "";
	const d = new Date(dateStr);
	return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
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
		<div className="max-w-6xl mx-auto overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0">
			<div className="flex gap-3 min-w-[900px]">
				{APPLICATION_STAGES.map((stage) => {
					const config = STAGE_CONFIG[stage];
					const Icon = config.icon;
					const stageApps = applications.filter(
						(app) => app.stage === stage,
					);
					const isDragOver = dragOverStage === stage;

					return (
						<div
							key={stage}
							className={`flex-1 min-w-[170px] rounded-xl border flex flex-col transition-colors duration-150 ${
								isDragOver
									? "bg-primary/5 border-primary/30 ring-2 ring-primary/10"
									: "bg-white/50 dark:bg-card/30 border-border/40"
							}`}
							onDragOver={(e) => handleDragOver(e, stage)}
							onDragLeave={handleDragLeave}
							onDrop={(e) => handleDrop(e, stage)}
						>
							{/* Column header */}
							<div
								className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-xl ${config.headerBg}`}
							>
								<Icon
									size={13}
									className={config.accentClass}
								/>
								<span className="text-xs font-semibold text-foreground uppercase tracking-wide">
									{STAGE_LABELS[stage]}
								</span>
								<span className="ml-auto text-[10px] text-muted-foreground font-semibold bg-white/60 dark:bg-background/60 px-1.5 py-0.5 rounded">
									{stageApps.length}
								</span>
							</div>

							{/* Cards */}
							<div className="p-2 space-y-2 flex-1 min-h-[100px]">
								{stageApps.length === 0 && !isDragOver && (
									<div className="text-center py-8 text-xs text-muted-foreground">
										No applications
									</div>
								)}

								{isDragOver && stageApps.length === 0 && (
									<div className="text-center py-8 text-xs text-primary font-medium">
										Drop here
									</div>
								)}

								{stageApps.map((app) => (
									<ApplicationCard
										key={app.id}
										app={app}
										stage={stage}
										config={config}
										onView={onView}
										onEdit={onEdit}
										onDelete={onDelete}
										onMove={onMove}
									/>
								))}

								{/* "+ Add job" button */}
								<button
									onClick={onAdd}
									className="w-full py-2 text-[10px] text-muted-foreground hover:text-primary transition-colors rounded-lg border border-dashed border-border/50 hover:border-primary/30"
								>
									+ Add job
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
	config: (typeof STAGE_CONFIG)[ApplicationStage];
	onView: (app: JobApplication) => void;
	onEdit: (app: JobApplication) => void;
	onDelete: (app: JobApplication) => void;
	onMove: (id: string, newStage: ApplicationStage) => void;
}

function ApplicationCard({
	app,
	stage,
	config,
	onView,
	onEdit,
	onDelete,
	onMove,
}: ApplicationCardProps) {
	const initials = getInitials(app.company);
	const initialsBg = getInitialsBg(app.company);
	const otherStages = APPLICATION_STAGES.filter((s) => s !== stage);
	const [isDragging, setIsDragging] = useState(false);

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
			className={`rounded-lg bg-white/80 dark:bg-card/30 border border-border/40 p-4 hover:border-primary/20 transition-all group shadow-sm cursor-grab active:cursor-grabbing min-h-[120px] ${
				isDragging ? "opacity-40 scale-95 rotate-1" : ""
			}`}
		>
			{/* Initials + role + company */}
			<div className="flex items-start gap-2.5 mb-2.5">
				<span
					className={`w-8 h-8 rounded-md flex items-center justify-center text-[10px] font-bold text-muted-foreground flex-shrink-0 ${initialsBg}`}
				>
					{initials}
				</span>
				<div className="min-w-0 flex-1">
					<p className="text-[13px] font-semibold text-foreground truncate leading-snug">
						{app.role}
					</p>
					<p className="text-[11px] text-muted-foreground truncate mt-0.5">
						{app.company}
						{app.location && ` · ${app.location}`}
					</p>
				</div>

				{/* Actions — appears on hover */}
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
					<button
						onClick={(e) => e.stopPropagation()}
						className="p-1 rounded hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
					>
							<MoreHorizontal
								size={12}
								className="text-muted-foreground"
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

			{/* Salary */}
			{app.salary && (
				<div className="flex items-center gap-1.5 mb-2">
					<DollarSign size={12} className="text-green-500" />
					<span className="text-[13px] font-bold text-green-500">
						{app.salary}
					</span>
				</div>
			)}

			{/* Interview date badge */}
			{app.interview_date && (
				<div className="flex items-center gap-1.5 mb-2">
					<Calendar size={11} className="text-amber-500" />
					<span className="text-[11px] font-medium text-muted-foreground">
						{formatDate(app.interview_date)}
					</span>
				</div>
			)}

			{/* Offer badge */}
			{stage === "offer" && (
				<div className="flex items-center gap-1.5 mb-2">
					<CheckCircle2 size={11} className="text-green-500" />
					<span className="text-[11px] font-medium text-muted-foreground">
						Offer received ✓
					</span>
				</div>
			)}

			{/* Footer */}
			<div className="flex items-center justify-between mt-3 pt-2 border-t border-border/30">
				<span className="text-[11px] text-muted-foreground">
					{formatDate(app.applied_at || app.created_at)}
				</span>
				<button
					onClick={(e) => {
						e.stopPropagation();
						onEdit(app);
					}}
					className={`text-[10px] font-semibold ${config.actionColor} inline-flex items-center gap-0.5 hover:underline`}
				>
					{config.actionLabel}
				</button>
			</div>
		</div>
	);
}
