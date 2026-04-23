"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import {
	ScanSearch,
	ChevronDown,
	ChevronUp,
	CheckCircle2,
	XCircle,
	AlertTriangle,
	Lightbulb,
	Target,
	BarChart3,
	Sparkles,
	FileText,
	ArrowLeft,
	Clock,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAtsScans, type AtsScan, getRelativeTime } from "@/hooks/useAtsScans";

/* ───────────────────────── Score color helpers ───────────────────────── */

function getScoreColor(score: number) {
	if (score >= 70)
		return {
			ring: "#22c55e",
			text: "text-green-600",
			bg: "bg-green-500/10",
			label: "Strong",
		};
	if (score >= 40)
		return {
			ring: "#f59e0b",
			text: "text-amber-600",
			bg: "bg-amber-500/10",
			label: "Needs Work",
		};
	return {
		ring: "#ef4444",
		text: "text-red-600",
		bg: "bg-red-500/10",
		label: "Low",
	};
}

function getDimensionColor(score: number) {
	if (score >= 70) return "bg-green-500";
	if (score >= 40) return "bg-amber-500";
	return "bg-red-500";
}

/* ─────────────────────── SVG Circular Score Gauge ─────────────────────── */

function ScoreGauge({ score, size = 56 }: { score: number; size?: number }) {
	const color = getScoreColor(score);
	const strokeWidth = 5;
	const radius = (size - strokeWidth) / 2;
	const circumference = 2 * Math.PI * radius;
	const offset = circumference - (score / 100) * circumference;

	return (
		<div
			className="relative flex items-center justify-center"
			style={{ width: size, height: size }}
		>
			<svg width={size} height={size} className="-rotate-90">
				<circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					fill="none"
					stroke="var(--surface-inset)"
					strokeWidth={strokeWidth}
				/>
				<circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					fill="none"
					stroke={color.ring}
					strokeWidth={strokeWidth}
					strokeDasharray={circumference}
					strokeDashoffset={offset}
					strokeLinecap="round"
				/>
			</svg>
			<div className="absolute inset-0 flex flex-col items-center justify-center">
				<span className={`text-sm font-bold ${color.text}`}>{score}</span>
			</div>
		</div>
	);
}

/* ───────────────────── Breakdown Bar Component ───────────────────── */

function BreakdownBar({
	label,
	value,
	weight,
}: {
	label: string;
	value: number;
	weight: string;
}) {
	return (
		<div className="space-y-1.5">
			<div className="flex items-center justify-between">
				<span className="text-sm text-text-primary font-medium">
					{label}
				</span>
				<span className="text-sm text-text-secondary">
					{value}
					<span className="text-text-tertiary text-xs">% · {weight}</span>
				</span>
			</div>
			<div className="h-2 rounded-full bg-surface-inset overflow-hidden">
				<div
					className={`h-full rounded-full transition-all duration-700 ease-out ${getDimensionColor(value)}`}
					style={{ width: `${value}%` }}
				/>
			</div>
		</div>
	);
}

/* ───────────────── Collapsible Section Wrapper ───────────────── */

function CollapsibleSection({
	title,
	icon,
	isOpen,
	onToggle,
	children,
}: {
	title: string;
	icon: React.ReactNode;
	isOpen: boolean;
	onToggle: () => void;
	children: React.ReactNode;
}) {
	return (
		<div className="rounded-xl border border-border-visible bg-surface-raised overflow-hidden">
			<button
				type="button"
				onClick={onToggle}
				className="w-full flex items-center gap-3 px-5 py-4 hover:bg-surface-inset/40 transition-colors text-left"
			>
				{icon}
				<span className="text-sm font-semibold text-text-primary flex-1">
					{title}
				</span>
				{isOpen ? (
					<ChevronUp size={16} className="text-text-tertiary" />
				) : (
					<ChevronDown size={16} className="text-text-tertiary" />
				)}
			</button>
			{isOpen && (
				<div className="px-5 pb-5 border-t border-border-visible/60 pt-4">
					{children}
				</div>
			)}
		</div>
	);
}

/* ────────────────── Keyword Pill ────────────────── */

function KeywordPill({
	word,
	variant,
}: {
	word: string;
	variant: "matched" | "missing" | "important";
}) {
	const styles = {
		matched: "bg-green-500/10 text-green-600 border-green-500/20",
		missing: "bg-red-500/10 text-red-600 border-red-500/20",
		important: "bg-accent/10 text-accent border-accent/20",
	};

	return (
		<span
			className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${styles[variant]}`}
		>
			{variant === "matched" && (
				<CheckCircle2 size={11} className="mr-1 shrink-0" />
			)}
			{variant === "missing" && (
				<XCircle size={11} className="mr-1 shrink-0" />
			)}
			{word}
		</span>
	);
}

/* ────────────────── Expanded Scan Detail ────────────────── */

function ScanDetail({ scan }: { scan: AtsScan }) {
	const result = scan.result_json as {
		score: number;
		breakdown?: Record<string, number>;
		keywords?: {
			matched?: string[];
			missing?: string[];
			important?: string[];
		};
		sections?: Record<string, boolean>;
		insights?: {
			strengths?: string[];
			weaknesses?: string[];
			suggestions?: string[];
		};
	};

	const [expandedSections, setExpandedSections] = useState<
		Record<string, boolean>
	>({
		breakdown: true,
		keywords: true,
		insights: true,
	});

	const toggle = (key: string) =>
		setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));

	const breakdownLabels: {
		key: string;
		label: string;
		weight: string;
	}[] = [
		{ key: "keywordMatch", label: "Keyword Match", weight: "45%" },
		{
			key: "experienceRelevance",
			label: "Experience Relevance",
			weight: "20%",
		},
		{
			key: "sectionCompleteness",
			label: "Section Completeness",
			weight: "15%",
		},
		{ key: "formatting", label: "Formatting", weight: "10%" },
		{
			key: "keywordDistribution",
			label: "Keyword Distribution",
			weight: "10%",
		},
	];

	return (
		<div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
			{/* Breakdown */}
			{result.breakdown && (
				<CollapsibleSection
					title="Score Breakdown"
					icon={<BarChart3 size={16} className="text-accent" />}
					isOpen={expandedSections.breakdown}
					onToggle={() => toggle("breakdown")}
				>
					<div className="space-y-3">
						{breakdownLabels.map(({ key, label, weight }) => (
							<BreakdownBar
								key={key}
								label={label}
								value={
									(result.breakdown as Record<string, number>)[
										key
									] || 0
								}
								weight={weight}
							/>
						))}
					</div>
				</CollapsibleSection>
			)}

			{/* Keywords */}
			{result.keywords && (
				<CollapsibleSection
					title="Keywords Analysis"
					icon={<Target size={16} className="text-accent" />}
					isOpen={expandedSections.keywords}
					onToggle={() => toggle("keywords")}
				>
					<div className="space-y-3">
						{(result.keywords.matched?.length ?? 0) > 0 && (
							<div>
								<p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
									Matched ({result.keywords.matched!.length})
								</p>
								<div className="flex flex-wrap gap-1.5">
									{result.keywords.matched!.map((kw) => (
										<KeywordPill
											key={kw}
											word={kw}
											variant="matched"
										/>
									))}
								</div>
							</div>
						)}
						{(result.keywords.missing?.length ?? 0) > 0 && (
							<div>
								<p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
									Missing ({result.keywords.missing!.length})
								</p>
								<div className="flex flex-wrap gap-1.5">
									{result.keywords.missing!.map((kw) => (
										<KeywordPill
											key={kw}
											word={kw}
											variant="missing"
										/>
									))}
								</div>
							</div>
						)}
					</div>
				</CollapsibleSection>
			)}

			{/* Insights */}
			{result.insights && (
				<CollapsibleSection
					title="Insights & Suggestions"
					icon={<Lightbulb size={16} className="text-accent" />}
					isOpen={expandedSections.insights}
					onToggle={() => toggle("insights")}
				>
					<div className="space-y-3">
						{(result.insights.strengths?.length ?? 0) > 0 && (
							<div>
								<p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
									<CheckCircle2 size={12} /> Strengths
								</p>
								<ul className="space-y-1.5">
									{result.insights.strengths!.map((s, i) => (
										<li
											key={i}
											className="text-sm text-text-secondary pl-5 relative before:content-[''] before:absolute before:left-0 before:top-[9px] before:w-2 before:h-2 before:rounded-full before:bg-green-500/40"
										>
											{s}
										</li>
									))}
								</ul>
							</div>
						)}
						{(result.insights.weaknesses?.length ?? 0) > 0 && (
							<div>
								<p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
									<AlertTriangle size={12} /> Weaknesses
								</p>
								<ul className="space-y-1.5">
									{result.insights.weaknesses!.map((w, i) => (
										<li
											key={i}
											className="text-sm text-text-secondary pl-5 relative before:content-[''] before:absolute before:left-0 before:top-[9px] before:w-2 before:h-2 before:rounded-full before:bg-amber-500/40"
										>
											{w}
										</li>
									))}
								</ul>
							</div>
						)}
						{(result.insights.suggestions?.length ?? 0) > 0 && (
							<div>
								<p className="text-xs font-semibold text-accent uppercase tracking-wider mb-2 flex items-center gap-1.5">
									<Sparkles size={12} /> Suggestions
								</p>
								<ul className="space-y-1.5">
									{result.insights.suggestions!.map((s, i) => (
										<li
											key={i}
											className="text-sm text-text-secondary pl-5 relative before:content-[''] before:absolute before:left-0 before:top-[9px] before:w-2 before:h-2 before:rounded-full before:bg-accent/40"
										>
											{s}
										</li>
									))}
								</ul>
							</div>
						)}
					</div>
				</CollapsibleSection>
			)}
		</div>
	);
}

/* ────────────────── Source Badge ────────────────── */

function SourceBadge({ source }: { source: string }) {
	const config: Record<string, { label: string; className: string }> = {
		saved: {
			label: "Uploaded",
			className:
				"bg-blue-500/10 text-blue-600 border-blue-500/20",
		},
		generated: {
			label: "AI Generated",
			className:
				"bg-purple-500/10 text-purple-600 border-purple-500/20",
		},
		paste: {
			label: "Pasted",
			className:
				"bg-gray-500/10 text-text-secondary border-border-visible",
		},
		upload: {
			label: "Uploaded File",
			className:
				"bg-blue-500/10 text-blue-600 border-blue-500/20",
		},
	};

	const c = config[source] || config.saved;

	return (
		<span
			className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${c.className}`}
		>
			{c.label}
		</span>
	);
}

/* ────────────────── Scan Row ────────────────── */

function ScanRow({
	scan,
	isExpanded,
	onToggle,
}: {
	scan: AtsScan;
	isExpanded: boolean;
	onToggle: () => void;
}) {
	const color = getScoreColor(scan.score);
	return (
		<div className="border-b border-border-subtle last:border-0">
			<button
				type="button"
				onClick={onToggle}
				className="w-full flex items-center gap-4 px-5 py-4 hover:bg-surface-inset/30 transition-colors text-left"
			>
				<ScoreGauge score={scan.score} size={48} />

				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2 mb-0.5">
						<p className="text-sm font-semibold text-text-primary truncate">
							{scan.resume_label}
						</p>
						<SourceBadge source={scan.resume_source} />
					</div>
					{scan.jd_snippet && (
						<p className="text-xs text-text-tertiary truncate max-w-md">
							{scan.jd_snippet}
						</p>
					)}
				</div>

				<div className="flex items-center gap-3 flex-shrink-0">
					<div className="text-right">
						<span className={`text-lg font-bold ${color.text}`}>
							{scan.score}%
						</span>
						<p className="text-[10px] text-text-tertiary">
							{color.label}
						</p>
					</div>
					<div className="flex items-center gap-2 text-text-tertiary">
						<Clock size={12} />
						<span className="text-xs whitespace-nowrap">
							{getRelativeTime(scan.created_at)}
						</span>
					</div>
					{isExpanded ? (
						<ChevronUp size={16} className="text-text-tertiary" />
					) : (
						<ChevronDown size={16} className="text-text-tertiary" />
					)}
				</div>
			</button>
			{isExpanded && (
				<div className="px-5 pb-5">
					<ScanDetail scan={scan} />
				</div>
			)}
		</div>
	);
}

/* ────────────────── Main Content ────────────────── */

function AtsScansContent() {
	const { scans, isLoading } = useAtsScans();
	const [expandedId, setExpandedId] = useState<string | null>(null);

	if (isLoading) {
		return (
			<div className="space-y-4">
				{[1, 2, 3].map((i) => (
					<Skeleton key={i} className="h-20 w-full rounded-xl" />
				))}
			</div>
		);
	}

	if (scans.length === 0) {
		return (
			<div className="rounded-xl border border-border-visible bg-surface-raised flex flex-col items-center justify-center py-20 px-6 text-center">
				<div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-4">
					<ScanSearch size={28} className="text-accent" />
				</div>
				<h3 className="text-lg font-semibold text-text-primary mb-1">
					No Scans Yet
				</h3>
				<p className="text-sm text-text-tertiary max-w-xs mb-4">
					Run your first ATS compatibility check to see your scan
					history here
				</p>
				<Link
					href="/dashboard/ats-checker"
					className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-accent hover:bg-accent-hover transition-colors"
				>
					<ScanSearch size={14} />
					Go to ATS Checker
				</Link>
			</div>
		);
	}

	return (
		<div className="rounded-xl border border-border-visible bg-surface-raised overflow-hidden">
			{/* Table header */}
			<div className="flex items-center gap-4 px-5 py-3 border-b border-border-visible text-xs text-text-tertiary font-medium">
				<span className="w-12">Score</span>
				<span className="flex-1">Resume</span>
				<span className="w-20 text-right">Score</span>
				<span className="w-28 text-right">Date</span>
				<span className="w-4" />
			</div>

			{scans.map((scan) => (
				<ScanRow
					key={scan.id}
					scan={scan}
					isExpanded={expandedId === scan.id}
					onToggle={() =>
						setExpandedId(
							expandedId === scan.id ? null : scan.id,
						)
					}
				/>
			))}
		</div>
	);
}

/* ────────────────── Page Shell ────────────────── */

export default function AtsScansPage() {
	return (
		<div
			className="applications-page p-6 md:p-8 min-h-screen"
			style={{ backgroundColor: "var(--surface-base)" }}
		>
			{/* Header */}
			<div
				className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"
				style={{ maxWidth: "1128px", margin: "0 auto 1.5rem" }}
			>
				<div>
					<div className="flex items-center gap-3 mb-1">
						<Link
							href="/dashboard"
							className="p-1.5 rounded-md hover:bg-surface-inset transition-colors text-text-secondary hover:text-text-primary"
						>
							<ArrowLeft size={18} />
						</Link>
						<h1 className="text-2xl font-semibold tracking-tight text-text-primary md:text-3xl">
							ATS Scan History
						</h1>
					</div>
					<p className="mt-1 text-sm text-text-secondary ml-10">
						Review your past ATS compatibility scans and results
					</p>
				</div>
				<Link
					href="/dashboard/ats-checker"
					className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-accent hover:bg-accent-hover transition-colors flex-shrink-0"
				>
					<ScanSearch size={14} />
					New Scan
				</Link>
			</div>

			<div style={{ maxWidth: "1128px", margin: "0 auto" }}>
				<Suspense
					fallback={
						<div className="space-y-4">
							{[1, 2, 3].map((i) => (
								<Skeleton
									key={i}
									className="h-20 w-full rounded-xl"
								/>
							))}
						</div>
					}
				>
					<AtsScansContent />
				</Suspense>
			</div>
		</div>
	);
}
