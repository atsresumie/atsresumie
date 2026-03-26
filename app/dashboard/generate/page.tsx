"use client";

import { Suspense, useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Sparkles, Loader2, Check, AlertCircle, Upload, Linkedin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useDraftJd } from "@/hooks/useDraftJd";
import { useResumeVersions } from "@/hooks/useResumeVersions";
import { useGenerations } from "@/hooks/useGenerations";
import { useCredits } from "@/hooks/useCredits";
import { JdQualityIndicator } from "@/components/dashboard/generate/JdQualityIndicator";
import { ResumeSelector } from "@/components/dashboard/generate/ResumeSelector";
import {
	ModeSelector,
	type GenerationMode,
} from "@/components/dashboard/generate/ModeSelector";

/**
 * Inner component that uses useSearchParams
 */
function GeneratePageContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { jdText, setJdText, clearDraft, isDraftSaved } = useDraftJd();
	const {
		resumes,
		defaultResume,
		isLoading: resumesLoading,
		refetch: refetchResumes,
	} = useResumeVersions();
	const { jobs } = useGenerations();
	const { credits } = useCredits();

	// State
	const [selectedResumeId, setSelectedResumeId] = useState<string | null>(
		null,
	);
	const [selectedObjectPath, setSelectedObjectPath] = useState<string | null>(
		null,
	);
	const [mode, setMode] = useState<GenerationMode>("quick");
	const [isGenerating, setIsGenerating] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isNoCredits, setIsNoCredits] = useState(false);
	const [additionalReqs, setAdditionalReqs] = useState("");
	const [linkedinUrl, setLinkedinUrl] = useState("");
	const [isImportingLinkedin, setIsImportingLinkedin] = useState(false);
	const [linkedinError, setLinkedinError] = useState<string | null>(null);
	const [linkedinSuccess, setLinkedinSuccess] = useState<string | null>(null);
	const [showLinkedinPaste, setShowLinkedinPaste] = useState(false);
	const [linkedinPastedText, setLinkedinPastedText] = useState("");
	const hasLoadedFromJobRef = useRef(false);

	// Auto-select default resume when loaded
	useEffect(() => {
		if (!selectedResumeId && defaultResume) {
			setSelectedResumeId(defaultResume.id);
			setSelectedObjectPath(defaultResume.object_path);
		}
	}, [defaultResume, selectedResumeId]);

	// Handle resume selection
	const handleResumeChange = (
		resumeId: string | null,
		objectPath: string | null,
	) => {
		setSelectedResumeId(resumeId);
		// If objectPath is null, find it from resumes list
		if (resumeId && !objectPath) {
			const resume = resumes.find((r) => r.id === resumeId);
			setSelectedObjectPath(resume?.object_path || null);
		} else {
			setSelectedObjectPath(objectPath);
		}
	};

	const handleLinkedInImport = async (viaPaste = false) => {
		const trimmedUrl = linkedinUrl.trim();
		const trimmedPaste = linkedinPastedText.trim();

		if (viaPaste && trimmedPaste.length < 50) {
			setLinkedinError("Please paste more profile content (at least a few lines).");
			return;
		}
		if (!viaPaste && !trimmedUrl) return;

		setIsImportingLinkedin(true);
		setLinkedinError(null);
		setLinkedinSuccess(null);

		try {
			const payload: Record<string, string> = {};
			if (trimmedUrl) payload.url = trimmedUrl;
			if (viaPaste && trimmedPaste) payload.pastedText = trimmedPaste;

			const res = await fetch("/api/linkedin/profile", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});

			const data = await res.json();

			if (!res.ok) {
				if (data.error === "SCRAPE_BLOCKED") {
					setShowLinkedinPaste(true);
					setLinkedinError(data.message);
				} else {
					setLinkedinError(data.error || data.message || "Failed to import LinkedIn profile");
				}
				return;
			}

			if (data.resume) {
				await refetchResumes();
				setSelectedResumeId(data.resume.id);
				setSelectedObjectPath(data.resume.object_path);
				setLinkedinSuccess(
					`Imported profile${data.profileName ? ` for ${data.profileName}` : ""} as base resume`,
				);
				setLinkedinUrl("");
				setLinkedinPastedText("");
				setShowLinkedinPaste(false);
			}
		} catch (err) {
			console.error("LinkedIn import error:", err);
			setLinkedinError("Failed to import profile. Please try again.");
		} finally {
			setIsImportingLinkedin(false);
		}
	};

	// Fetch JD from a specific job (for duplicate action)
	const fetchJobJd = useCallback(
		async (jobId: string) => {
			try {
				const { supabaseBrowser } =
					await import("@/lib/supabase/browser");
				const supabase = supabaseBrowser();
				const { data: job } = await supabase
					.from("generation_jobs")
					.select("jd_text")
					.eq("id", jobId)
					.single();

				if (job?.jd_text) {
					setJdText(job.jd_text);
				}
			} catch (err) {
				console.error("Failed to load job JD:", err);
			}
		},
		[setJdText],
	);

	// Handle fromJobId query param for duplicate action
	useEffect(() => {
		const fromJobId = searchParams.get("fromJobId");
		if (fromJobId && !hasLoadedFromJobRef.current) {
			hasLoadedFromJobRef.current = true;

			// Find the job in our loaded jobs list
			const job = jobs.find((j) => j.id === fromJobId);
			if (job?.jd_text) {
				setJdText(job.jd_text);
			} else {
				// Fetch the job directly if not in list
				fetchJobJd(fromJobId);
			}
		}
	}, [searchParams, jobs, setJdText, fetchJobJd]);

	// Handle prefill from saved JDs (via localStorage)
	useEffect(() => {
		if (typeof window === "undefined") return;

		const PREFILL_KEY = "atsresumie_generate_prefill_jd";
		try {
			const prefillJd = localStorage.getItem(PREFILL_KEY);
			if (prefillJd) {
				// Clear immediately to prevent re-prefilling on refresh
				localStorage.removeItem(PREFILL_KEY);
				setJdText(prefillJd);
				console.log("[Generate] Prefilled JD from saved JDs");
			}
		} catch (err) {
			console.warn("Failed to read prefill from localStorage:", err);
		}
	}, [setJdText]);

	const handleClear = () => {
		clearDraft();
		setError(null);
		setIsNoCredits(false);
	};

	const handleGenerate = async () => {
		if (!jdText.trim()) {
			setError("Please enter a job description");
			return;
		}

		if (!selectedObjectPath) {
			setError("Please select a resume first");
			return;
		}

		setIsGenerating(true);
		setError(null);
		setIsNoCredits(false);

		try {
			const res = await fetch("/api/generate", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					jdText: jdText.trim(),
					resumeObjectPath: selectedObjectPath,
					mode: mode,
				}),
			});

			const data = await res.json();

			if (!res.ok) {
				if (data.code === "NO_CREDITS") {
					setIsNoCredits(true);
					setError("You have no credits remaining");
				} else {
					setError(data.error || "Failed to start generation");
				}
				return;
			}

			// Success - clear draft and redirect
			clearDraft();
			router.push(`/dashboard/generations?highlight=${data.jobId}`);
		} catch (err) {
			console.error("Generate error:", err);
			setError("Failed to start generation. Please try again.");
		} finally {
			setIsGenerating(false);
		}
	};

	const canGenerate =
		jdText.trim().length >= 50 && !!selectedObjectPath && !isGenerating;

	return (
		<div
			className="grid grid-cols-1 lg:grid-cols-[1fr_340px] items-start mx-auto"
			style={{ maxWidth: "1128px", gap: "24px" }}
		>
			{/* LEFT COLUMN — single card */}
			<div className="rounded-xl border border-border-visible bg-surface-raised p-5 space-y-5">
				{/* Step 1 — Select Your Base Resume */}
				<div>
					<h3 className="text-sm font-semibold text-text-primary mb-3 font-body">
						Step 1 — Select Your Base Resume
					</h3>

					<ResumeSelector
						selectedId={selectedResumeId}
						onResumeChange={handleResumeChange}
					/>

					{/* LinkedIn Profile Import */}
					<div className="mt-4">
						<div className="flex items-center gap-2 mb-2">
							<Linkedin size={16} className="text-[#0A66C2]" />
							<p className="text-sm font-medium text-text-secondary">
								Or import from LinkedIn
							</p>
						</div>
						<div className="flex gap-2">
							<Input
								type="text"
								placeholder="Username or https://linkedin.com/in/username"
								value={linkedinUrl}
								onChange={(e) => {
									setLinkedinUrl(e.target.value);
									setLinkedinError(null);
									setLinkedinSuccess(null);
								}}
								disabled={isImportingLinkedin}
								className="flex-1 text-sm"
							/>
							<Button
								variant="outline"
								size="default"
								onClick={() => handleLinkedInImport(false)}
								disabled={
									!linkedinUrl.trim() || isImportingLinkedin
								}
								className="shrink-0 gap-2 border-[#0A66C2]/30 hover:bg-[#0A66C2]/5 hover:border-[#0A66C2]/50"
							>
								{isImportingLinkedin && !showLinkedinPaste ? (
									<>
										<Loader2
											size={14}
											className="animate-spin"
										/>
										Importing…
									</>
								) : (
									"Import"
								)}
							</Button>
						</div>

						{/* Paste fallback — shown when scraping is blocked */}
						{showLinkedinPaste && (
							<div className="mt-3 rounded-lg border border-border-visible bg-surface-raised p-3 space-y-2">
								<p className="text-xs text-text-secondary">
									LinkedIn blocked automatic import. Paste your profile content below instead:
								</p>
								<ol className="text-xs text-text-tertiary list-decimal pl-4 space-y-0.5">
									<li>Open your LinkedIn profile in a browser</li>
									<li>Select all text on the page (Ctrl+A / Cmd+A)</li>
									<li>Copy (Ctrl+C / Cmd+C) and paste below</li>
								</ol>
								<Textarea
									placeholder="Paste your LinkedIn profile content here…"
									value={linkedinPastedText}
									onChange={(e) => {
										setLinkedinPastedText(e.target.value);
										setLinkedinError(null);
									}}
									rows={5}
									className="resize-none text-sm border-border-visible bg-surface-raised"
								/>
								<div className="flex gap-2">
									<Button
										variant="default"
										size="sm"
										onClick={() => handleLinkedInImport(true)}
										disabled={
											linkedinPastedText.trim().length < 50 ||
											isImportingLinkedin
										}
										className="gap-2"
									>
										{isImportingLinkedin ? (
											<>
												<Loader2
													size={14}
													className="animate-spin"
												/>
												Saving…
											</>
										) : (
											"Use as Base Resume"
										)}
									</Button>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => {
											setShowLinkedinPaste(false);
											setLinkedinPastedText("");
											setLinkedinError(null);
										}}
									>
										Cancel
									</Button>
								</div>
							</div>
						)}

						{linkedinError && !showLinkedinPaste && (
							<p className="mt-1.5 text-xs text-error flex items-center gap-1">
								<AlertCircle size={12} />
								{linkedinError}
							</p>
						)}
						{linkedinSuccess && (
							<p className="mt-1.5 text-xs text-success flex items-center gap-1">
								<Check size={12} />
								{linkedinSuccess}
							</p>
						)}
					</div>
				</div>

				{/* Divider */}
				<hr className="border-border-visible" />

				{/* Additional Requirements */}
				<div>
					<h3 className="text-sm font-semibold text-text-primary mb-2 font-body">
						Additional Requirements (Optional)
					</h3>
					<textarea
						value={additionalReqs}
						onChange={(e) => setAdditionalReqs(e.target.value)}
						placeholder="If you have any additional requirements......"
						rows={2}
						className="w-full px-3 py-2.5 rounded-lg border border-border-visible bg-surface-raised text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent resize-none"
					/>
				</div>

				{/* Divider */}
				<hr className="border-border-visible" />

				{/* Step 2 — Job Description */}
				<div>
					<div className="mb-2 flex items-center justify-between">
						<h3 className="text-sm font-semibold text-text-primary font-body">
							Step 2 — Job Description
						</h3>
						{isDraftSaved && jdText.trim() && (
							<span className="flex items-center gap-1 text-xs text-success">
								<Check size={12} />
								Draft saved
							</span>
						)}
					</div>
					<Textarea
						placeholder="Paste the full job description here......."
						value={jdText}
						onChange={(e) => setJdText(e.target.value)}
						onInput={(e) =>
							setJdText((e.target as HTMLTextAreaElement).value)
						}
						rows={8}
						className="resize-none text-sm border-border-visible bg-surface-raised"
					/>

					{/* JD Quality Indicator */}
					{jdText.trim().length > 0 && (
						<div className="mt-2">
							<JdQualityIndicator
								characterCount={jdText.trim().length}
							/>
						</div>
					)}

					{/* Clear button */}
					{jdText.trim() && (
						<div className="mt-2">
							<Button
								variant="ghost"
								size="sm"
								onClick={handleClear}
								disabled={isGenerating}
							>
								Clear
							</Button>
						</div>
					)}
				</div>
			</div>

			{/* RIGHT COLUMN */}
			<div className="space-y-6 lg:sticky lg:top-20">
				{/* Step 3 — Tailoring Options */}
				<div className="rounded-xl border border-border-visible bg-surface-raised p-6">
					<h3 className="text-base font-semibold text-text-primary mb-4 font-body">
						Step 3 — Tailoring Options
					</h3>
					<ModeSelector
						value={mode}
						onChange={setMode}
						disabled={isGenerating}
					/>
				</div>

				{/* What happens next */}
				<div className="rounded-xl border border-border-visible bg-surface-raised p-6">
					<h3 className="text-base font-semibold text-text-primary mb-3 font-body">
						What happens next
					</h3>
					<ul className="space-y-2 text-sm text-text-secondary">
						<li className="flex items-start gap-2">
							<span className="text-text-tertiary mt-0.5">•</span>
							We analyze the JD for key skills & requirements
						</li>
						<li className="flex items-start gap-2">
							<span className="text-text-tertiary mt-0.5">•</span>
							Your bullets get rewritten to match — no fabrications
						</li>
						<li className="flex items-start gap-2">
							<span className="text-text-tertiary mt-0.5">•</span>
							ATS compliance is verified automatically
						</li>
						<li className="flex items-start gap-2">
							<span className="text-text-tertiary mt-0.5">•</span>
							PDF ready to download in under 60 seconds
						</li>
					</ul>
				</div>

				{/* Generate button */}
				<div>
					{error && (
						<div className="mb-3 rounded-lg border border-error/20 bg-error-muted p-3">
							<div className="flex items-start gap-2">
								<AlertCircle
									size={16}
									className="mt-0.5 flex-shrink-0 text-error"
								/>
								<div className="flex-1">
									<p className="text-sm text-error">{error}</p>
									{isNoCredits && (
										<Link href="/dashboard/credits">
											<Button
												variant="link"
												size="sm"
												className="h-auto p-0 text-error underline"
											>
												Get more credits →
											</Button>
										</Link>
									)}
								</div>
							</div>
						</div>
					)}

					<button
						onClick={handleGenerate}
						disabled={!canGenerate}
						className="w-full py-3.5 rounded-full text-sm font-semibold text-white bg-cta hover:bg-cta-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{isGenerating ? (
							<span className="inline-flex items-center gap-2">
								<Loader2 size={16} className="animate-spin" />
								Tailoring…
							</span>
						) : (
							"Generate Tailor Resume"
						)}
					</button>

					{credits !== null && (
						<p className="text-center text-xs text-text-tertiary mt-2">
							{credits} credits remaining this month
						</p>
					)}
				</div>
			</div>
		</div>
	);
}

/**
 * Loading fallback for Suspense
 */
function GeneratePageSkeleton() {
	return (
		<div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
			<div className="space-y-6">
				<Skeleton className="h-64 w-full rounded-xl" />
				<Skeleton className="h-32 w-full rounded-xl" />
				<Skeleton className="h-80 w-full rounded-xl" />
			</div>
			<div className="space-y-6">
				<Skeleton className="h-48 w-full rounded-xl" />
				<Skeleton className="h-40 w-full rounded-xl" />
				<Skeleton className="h-14 w-full rounded-full" />
			</div>
		</div>
	);
}

/**
 * Main page component with Suspense boundary
 */
export default function GeneratePage() {
	return (
		<div className="applications-page p-6 md:p-8 min-h-screen" style={{ backgroundColor: "var(--surface-base)" }}>
			{/* Header */}
			<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight text-text-primary md:text-3xl">
						Tailor Resume
					</h1>
					<p className="mt-1.5 text-sm text-text-secondary">
						AI-powered resume tailoring · Grounded in your real experience · Zero hallucinations
					</p>
				</div>
				<button
					onClick={() => window.location.reload()}
					className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-accent hover:bg-accent-hover transition-colors flex-shrink-0"
				>
					Tailor New Version
				</button>
			</div>

			<Suspense fallback={<GeneratePageSkeleton />}>
				<GeneratePageContent />
			</Suspense>
		</div>
	);
}
