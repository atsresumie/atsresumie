"use client";

import { useState, Suspense, useCallback } from "react";
import {
	Search,
	FileText,
	Upload,
	ChevronDown,
	ChevronUp,
	CheckCircle2,
	XCircle,
	AlertTriangle,
	Lightbulb,
	Target,
	BarChart3,
	Sparkles,
	Loader2,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
	useResumeVersions,
	type ResumeVersion,
} from "@/hooks/useResumeVersions";

/* ────────────────────────────── Types ────────────────────────────── */

interface AtsBreakdown {
	keywordMatch: number;
	experienceRelevance: number;
	sectionCompleteness: number;
	formatting: number;
	keywordDistribution: number;
}

interface AtsKeywords {
	matched: string[];
	missing: string[];
	important: string[];
}

interface AtsSections {
	summary: boolean;
	experience: boolean;
	skills: boolean;
	education: boolean;
	[key: string]: boolean;
}

interface AtsInsights {
	strengths: string[];
	weaknesses: string[];
	suggestions: string[];
}

interface AtsResult {
	score: number;
	breakdown: AtsBreakdown;
	keywords: AtsKeywords;
	sections: AtsSections;
	insights: AtsInsights;
}

/* ───────────────────────── Score color helpers ───────────────────────── */

function getScoreColor(score: number) {
	if (score >= 70) return { ring: "#22c55e", text: "text-green-400", bg: "bg-green-500/10", label: "Strong" };
	if (score >= 40) return { ring: "#f59e0b", text: "text-amber-400", bg: "bg-amber-500/10", label: "Needs Work" };
	return { ring: "#ef4444", text: "text-red-400", bg: "bg-red-500/10", label: "Low" };
}

function getDimensionColor(score: number) {
	if (score >= 70) return "bg-green-500";
	if (score >= 40) return "bg-amber-500";
	return "bg-red-500";
}

/* ─────────────────────── SVG Circular Score Gauge ─────────────────────── */

function ScoreGauge({ score, size = 180 }: { score: number; size?: number }) {
	const color = getScoreColor(score);
	const strokeWidth = 10;
	const radius = (size - strokeWidth) / 2;
	const circumference = 2 * Math.PI * radius;
	const offset = circumference - (score / 100) * circumference;

	return (
		<div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
			<svg width={size} height={size} className="-rotate-90">
				{/* Background track */}
				<circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					fill="none"
					stroke="var(--surface-inset)"
					strokeWidth={strokeWidth}
				/>
				{/* Score arc */}
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
					className="transition-all duration-1000 ease-out"
				/>
			</svg>
			<div className="absolute inset-0 flex flex-col items-center justify-center">
				<span className={`text-5xl font-bold ${color.text}`}>{score}</span>
				<span className="text-xs text-text-tertiary mt-1">{color.label}</span>
			</div>
		</div>
	);
}

/* ───────────────────── Breakdown Bar Component ───────────────────── */

function BreakdownBar({ label, value, weight }: { label: string; value: number; weight: string }) {
	return (
		<div className="space-y-1.5">
			<div className="flex items-center justify-between">
				<span className="text-sm text-text-primary font-medium">{label}</span>
				<span className="text-sm text-text-secondary">
					{value}<span className="text-text-tertiary text-xs">% · {weight}</span>
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

/* ───────────────────── Keyword Pill ───────────────────── */

function KeywordPill({ word, variant }: { word: string; variant: "matched" | "missing" | "important" }) {
	const styles = {
		matched: "bg-green-500/10 text-green-400 border-green-500/20",
		missing: "bg-red-500/10 text-red-400 border-red-500/20",
		important: "bg-accent/10 text-accent border-accent/20",
	};

	return (
		<span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${styles[variant]}`}>
			{variant === "matched" && <CheckCircle2 size={11} className="mr-1 shrink-0" />}
			{variant === "missing" && <XCircle size={11} className="mr-1 shrink-0" />}
			{word}
		</span>
	);
}

/* ───────────────────── Section Check ───────────────────── */

function SectionCheck({ name, present }: { name: string; present: boolean }) {
	return (
		<div className="flex items-center gap-2.5 py-1.5">
			{present ? (
				<CheckCircle2 size={16} className="text-green-400 shrink-0" />
			) : (
				<XCircle size={16} className="text-red-400 shrink-0" />
			)}
			<span className={`text-sm capitalize ${present ? "text-text-primary" : "text-text-tertiary"}`}>
				{name}
			</span>
		</div>
	);
}

/* ──────────────────────── Results Panel ──────────────────────── */

function ResultsPanel({ result }: { result: AtsResult }) {
	const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
		breakdown: true,
		keywords: true,
		sections: false,
		insights: true,
	});

	const toggle = (key: string) =>
		setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));

	const breakdownLabels: { key: keyof AtsBreakdown; label: string; weight: string }[] = [
		{ key: "keywordMatch", label: "Keyword Match", weight: "45%" },
		{ key: "experienceRelevance", label: "Experience Relevance", weight: "20%" },
		{ key: "sectionCompleteness", label: "Section Completeness", weight: "15%" },
		{ key: "formatting", label: "Formatting", weight: "10%" },
		{ key: "keywordDistribution", label: "Keyword Distribution", weight: "10%" },
	];

	return (
		<div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
			{/* Score Gauge */}
			<div className="rounded-xl border border-border-visible bg-surface-raised p-6 flex flex-col items-center">
				<h2 className="text-lg font-semibold text-text-primary mb-4">ATS Compatibility Score</h2>
				<ScoreGauge score={result.score} />
			</div>

			{/* Breakdown */}
			<CollapsibleSection
				title="Score Breakdown"
				icon={<BarChart3 size={18} className="text-accent" />}
				isOpen={expandedSections.breakdown}
				onToggle={() => toggle("breakdown")}
			>
				<div className="space-y-4">
					{breakdownLabels.map(({ key, label, weight }) => (
						<BreakdownBar
							key={key}
							label={label}
							value={result.breakdown[key]}
							weight={weight}
						/>
					))}
				</div>
			</CollapsibleSection>

			{/* Keywords */}
			<CollapsibleSection
				title="Keywords Analysis"
				icon={<Target size={18} className="text-accent" />}
				isOpen={expandedSections.keywords}
				onToggle={() => toggle("keywords")}
			>
				<div className="space-y-4">
					{result.keywords.matched.length > 0 && (
						<div>
							<p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
								Matched ({result.keywords.matched.length})
							</p>
							<div className="flex flex-wrap gap-1.5">
								{result.keywords.matched.map((kw) => (
									<KeywordPill key={kw} word={kw} variant="matched" />
								))}
							</div>
						</div>
					)}
					{result.keywords.missing.length > 0 && (
						<div>
							<p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
								Missing ({result.keywords.missing.length})
							</p>
							<div className="flex flex-wrap gap-1.5">
								{result.keywords.missing.map((kw) => (
									<KeywordPill key={kw} word={kw} variant="missing" />
								))}
							</div>
						</div>
					)}
					{result.keywords.important.length > 0 && (
						<div>
							<p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">
								Important Keywords
							</p>
							<div className="flex flex-wrap gap-1.5">
								{result.keywords.important.map((kw) => (
									<KeywordPill key={kw} word={kw} variant="important" />
								))}
							</div>
						</div>
					)}
				</div>
			</CollapsibleSection>

			{/* Sections Detected */}
			<CollapsibleSection
				title="Sections Detected"
				icon={<FileText size={18} className="text-accent" />}
				isOpen={expandedSections.sections}
				onToggle={() => toggle("sections")}
			>
				<div className="grid grid-cols-2 gap-x-6">
					{Object.entries(result.sections).map(([name, present]) => (
						<SectionCheck key={name} name={name} present={present} />
					))}
				</div>
			</CollapsibleSection>

			{/* Insights */}
			<CollapsibleSection
				title="Insights & Suggestions"
				icon={<Lightbulb size={18} className="text-accent" />}
				isOpen={expandedSections.insights}
				onToggle={() => toggle("insights")}
			>
				<div className="space-y-4">
					{result.insights.strengths.length > 0 && (
						<div>
							<p className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
								<CheckCircle2 size={12} /> Strengths
							</p>
							<ul className="space-y-1.5">
								{result.insights.strengths.map((s, i) => (
									<li key={i} className="text-sm text-text-secondary pl-5 relative before:content-[''] before:absolute before:left-0 before:top-[9px] before:w-2 before:h-2 before:rounded-full before:bg-green-500/40">
										{s}
									</li>
								))}
							</ul>
						</div>
					)}
					{result.insights.weaknesses.length > 0 && (
						<div>
							<p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
								<AlertTriangle size={12} /> Weaknesses
							</p>
							<ul className="space-y-1.5">
								{result.insights.weaknesses.map((w, i) => (
									<li key={i} className="text-sm text-text-secondary pl-5 relative before:content-[''] before:absolute before:left-0 before:top-[9px] before:w-2 before:h-2 before:rounded-full before:bg-amber-500/40">
										{w}
									</li>
								))}
							</ul>
						</div>
					)}
					{result.insights.suggestions.length > 0 && (
						<div>
							<p className="text-xs font-semibold text-accent uppercase tracking-wider mb-2 flex items-center gap-1.5">
								<Sparkles size={12} /> Suggestions
							</p>
							<ul className="space-y-1.5">
								{result.insights.suggestions.map((s, i) => (
									<li key={i} className="text-sm text-text-secondary pl-5 relative before:content-[''] before:absolute before:left-0 before:top-[9px] before:w-2 before:h-2 before:rounded-full before:bg-accent/40">
										{s}
									</li>
								))}
							</ul>
						</div>
					)}
				</div>
			</CollapsibleSection>
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
				<span className="text-sm font-semibold text-text-primary flex-1">{title}</span>
				{isOpen ? (
					<ChevronUp size={16} className="text-text-tertiary" />
				) : (
					<ChevronDown size={16} className="text-text-tertiary" />
				)}
			</button>
			{isOpen && <div className="px-5 pb-5 border-t border-border-visible/60 pt-4">{children}</div>}
		</div>
	);
}

/* ───────────────── Resume Source Selector ───────────────── */

type ResumeSource = "saved" | "paste" | "upload";

function ResumeInput({
	source,
	setSource,
	resumes,
	selectedResumeId,
	setSelectedResumeId,
	pastedText,
	setPastedText,
	uploadedFile,
	setUploadedFile,
}: {
	source: ResumeSource;
	setSource: (s: ResumeSource) => void;
	resumes: ResumeVersion[];
	selectedResumeId: string | null;
	setSelectedResumeId: (id: string | null) => void;
	pastedText: string;
	setPastedText: (t: string) => void;
	uploadedFile: File | null;
	setUploadedFile: (f: File | null) => void;
}) {
	const sources: { value: ResumeSource; label: string; icon: React.ReactNode }[] = [
		{ value: "saved", label: "Saved Resume", icon: <FileText size={14} /> },
		{ value: "paste", label: "Paste Text", icon: <FileText size={14} /> },
		{ value: "upload", label: "Upload PDF", icon: <Upload size={14} /> },
	];

	return (
		<div className="space-y-3">
			<label className="text-sm font-semibold text-text-primary">Resume</label>

			{/* Source toggle */}
			<div className="flex gap-1.5 p-1 rounded-lg bg-surface-inset border border-border-subtle">
				{sources.map((s) => (
					<button
						key={s.value}
						type="button"
						onClick={() => setSource(s.value)}
						className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-all ${
							source === s.value
								? "bg-surface-raised text-text-primary shadow-sm border border-border-visible"
								: "text-text-tertiary hover:text-text-secondary"
						}`}
					>
						{s.icon}
						{s.label}
					</button>
				))}
			</div>

			{/* Source content */}
			{source === "saved" && (
				<select
					value={selectedResumeId || ""}
					onChange={(e) => setSelectedResumeId(e.target.value || null)}
					className="w-full h-11 px-3 rounded-lg border border-border-visible bg-surface-raised text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent transition-colors"
				>
					<option value="">Select a saved resume…</option>
					{resumes.map((r) => (
						<option key={r.id} value={r.id}>
							{r.label}
						</option>
					))}
				</select>
			)}

			{source === "paste" && (
				<Textarea
					value={pastedText}
					onChange={(e) => setPastedText(e.target.value)}
					placeholder="Paste your full resume text here…"
					rows={8}
					className="resize-none text-sm border-border-visible bg-surface-raised"
				/>
			)}

			{source === "upload" && (
				<div
					className={`rounded-lg border-2 border-dashed py-8 px-4 text-center cursor-pointer transition-colors ${
						uploadedFile
							? "border-accent/40 bg-accent/5"
							: "border-border-visible hover:border-accent/30"
					}`}
					onClick={() => {
						const input = document.createElement("input");
						input.type = "file";
						input.accept = ".pdf,.docx,.doc,.txt";
						input.onchange = (e) => {
							const file = (e.target as HTMLInputElement).files?.[0];
							if (file) setUploadedFile(file);
						};
						input.click();
					}}
				>
					{uploadedFile ? (
						<div className="flex items-center justify-center gap-2">
							<FileText size={18} className="text-accent" />
							<span className="text-sm text-text-primary font-medium">{uploadedFile.name}</span>
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									setUploadedFile(null);
								}}
								className="text-text-tertiary hover:text-red-400 ml-2"
							>
								<XCircle size={16} />
							</button>
						</div>
					) : (
						<>
							<Upload className="mx-auto h-6 w-6 text-text-tertiary mb-2" />
							<p className="text-sm text-text-secondary">
								Drop a PDF, DOCX, or TXT file
							</p>
						</>
					)}
				</div>
			)}
		</div>
	);
}

/* ─────────────────── Main Page Content ─────────────────── */

function ATSCheckerContent() {
	const { resumes } = useResumeVersions();

	// Input state
	const [jobDescription, setJobDescription] = useState("");
	const [resumeSource, setResumeSource] = useState<ResumeSource>("saved");
	const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
	const [pastedText, setPastedText] = useState("");
	const [uploadedFile, setUploadedFile] = useState<File | null>(null);

	// Result state
	const [result, setResult] = useState<AtsResult | null>(null);
	const [isAnalyzing, setIsAnalyzing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Auto-select default resume
	const defaultResume = resumes.find((r) => r.is_default);
	if (!selectedResumeId && defaultResume && resumeSource === "saved") {
		setSelectedResumeId(defaultResume.id);
	}

	const canAnalyze = useCallback(() => {
		if (!jobDescription.trim()) return false;
		if (resumeSource === "saved" && !selectedResumeId) return false;
		if (resumeSource === "paste" && !pastedText.trim()) return false;
		if (resumeSource === "upload" && !uploadedFile) return false;
		return true;
	}, [jobDescription, resumeSource, selectedResumeId, pastedText, uploadedFile]);

	const handleAnalyze = async () => {
		if (!canAnalyze() || isAnalyzing) return;

		setIsAnalyzing(true);
		setError(null);
		setResult(null);

		try {
			let body: Record<string, string> = { jobDescription: jobDescription.trim() };

			if (resumeSource === "saved") {
				const resume = resumes.find((r) => r.id === selectedResumeId);
				if (!resume) throw new Error("Resume not found");

				// If we have resume_text stored, send it directly; otherwise use objectPath
				if (resume.resume_text) {
					body.resumeText = resume.resume_text;
				} else {
					body.objectPath = resume.object_path;
				}
			} else if (resumeSource === "paste") {
				body.resumeText = pastedText.trim();
			}

			let res: Response;

			if (resumeSource === "upload" && uploadedFile) {
				// Multipart upload
				const formData = new FormData();
				formData.append("jobDescription", jobDescription.trim());
				formData.append("resumeFile", uploadedFile);
				res = await fetch("/api/ats-check", {
					method: "POST",
					body: formData,
				});
			} else {
				res = await fetch("/api/ats-check", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(body),
				});
			}

			if (!res.ok) {
				const errData = await res.json().catch(() => ({}));
				throw new Error(errData.error || errData.message || `HTTP ${res.status}`);
			}

			const data: AtsResult = await res.json();
			setResult(data);
		} catch (err) {
			console.error("[ATSChecker] Analysis failed:", err);
			setError(err instanceof Error ? err.message : "Analysis failed");
		} finally {
			setIsAnalyzing(false);
		}
	};

	return (
		<div
			className="grid grid-cols-1 lg:grid-cols-2 items-start mx-auto gap-6"
			style={{ maxWidth: "1128px" }}
		>
			{/* LEFT — Input Panel */}
			<div className="space-y-5 lg:sticky lg:top-20">
				<div className="rounded-xl border border-border-visible bg-surface-raised p-5 space-y-5">
					{/* Job Description */}
					<div className="space-y-2">
						<label className="text-sm font-semibold text-text-primary">
							Job Description
						</label>
						<Textarea
							value={jobDescription}
							onChange={(e) => setJobDescription(e.target.value)}
							placeholder="Paste the full job description you're applying to…"
							rows={8}
							className="resize-none text-sm border-border-visible bg-surface-raised"
						/>
						<p className="text-xs text-text-tertiary">
							{jobDescription.length > 0
								? `${jobDescription.length.toLocaleString()} characters`
								: "Required — paste the complete JD for best results"}
						</p>
					</div>

					{/* Resume Input */}
					<ResumeInput
						source={resumeSource}
						setSource={setResumeSource}
						resumes={resumes}
						selectedResumeId={selectedResumeId}
						setSelectedResumeId={setSelectedResumeId}
						pastedText={pastedText}
						setPastedText={setPastedText}
						uploadedFile={uploadedFile}
						setUploadedFile={setUploadedFile}
					/>

					{/* Error */}
					{error && (
						<div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
							<p className="text-sm text-red-400">{error}</p>
						</div>
					)}

					{/* Analyze Button */}
					<button
						type="button"
						onClick={handleAnalyze}
						disabled={!canAnalyze() || isAnalyzing}
						className="w-full py-3 rounded-full text-sm font-semibold text-white bg-cta hover:bg-cta-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
					>
						{isAnalyzing ? (
							<>
								<Loader2 size={16} className="animate-spin" />
								Analyzing…
							</>
						) : (
							<>
								<Search size={16} />
								Analyze ATS Compatibility
							</>
						)}
					</button>
				</div>

				{/* How it works */}
				<div className="rounded-xl border border-border-visible bg-surface-raised p-5">
					<h3 className="text-sm font-semibold text-text-primary mb-3">How It Works</h3>
					<div className="space-y-3">
						{[
							{ step: "1", text: "Paste the job description you're targeting" },
							{ step: "2", text: "Select or upload your resume" },
							{ step: "3", text: "Get your ATS compatibility score with detailed breakdown" },
						].map(({ step, text }) => (
							<div key={step} className="flex items-start gap-3">
								<span className="w-6 h-6 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
									{step}
								</span>
								<p className="text-sm text-text-secondary">{text}</p>
							</div>
						))}
					</div>
					<div className="mt-4 pt-3 border-t border-border-subtle">
						<p className="text-xs text-text-tertiary">
							Powered by deterministic NLP scoring — no AI hallucinations, instant results (~3ms).
						</p>
					</div>
				</div>
			</div>

			{/* RIGHT — Results Panel */}
			<div className="min-h-[400px]">
				{isAnalyzing ? (
					<div className="space-y-4">
						<Skeleton className="h-[280px] w-full rounded-xl" />
						<Skeleton className="h-[180px] w-full rounded-xl" />
						<Skeleton className="h-[140px] w-full rounded-xl" />
					</div>
				) : result ? (
					<ResultsPanel result={result} />
				) : (
					<div className="rounded-xl border border-border-visible bg-surface-raised flex flex-col items-center justify-center py-20 px-6 text-center">
						<div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-4">
							<Search size={28} className="text-accent" />
						</div>
						<h3 className="text-lg font-semibold text-text-primary mb-1">
							Ready to Analyze
						</h3>
						<p className="text-sm text-text-tertiary max-w-xs">
							Enter your job description and resume to get your ATS compatibility score
						</p>
					</div>
				)}
			</div>
		</div>
	);
}

/* ─────────────────────────── Page Shell ─────────────────────────── */

export default function ATSCheckerPage() {
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
					<h1 className="text-2xl font-semibold tracking-tight text-text-primary md:text-3xl">
						ATS Checker
					</h1>
					<p className="mt-1.5 text-sm text-text-secondary">
						Score your resume against any job description — see what ATS systems see
					</p>
				</div>
			</div>

			<Suspense
				fallback={
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ maxWidth: "1128px", margin: "0 auto" }}>
						<Skeleton className="h-[500px] w-full rounded-xl" />
						<Skeleton className="h-[400px] w-full rounded-xl" />
					</div>
				}
			>
				<ATSCheckerContent />
			</Suspense>
		</div>
	);
}
