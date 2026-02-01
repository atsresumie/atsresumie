"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Sparkles, RotateCcw, Loader2, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useDraftJd } from "@/hooks/useDraftJd";
import { useUserResume } from "@/hooks/useUserResume";
import { useGenerations } from "@/hooks/useGenerations";
import { JdQualityIndicator } from "@/components/dashboard/generate/JdQualityIndicator";
import { PastGenerationPicker } from "@/components/dashboard/generate/PastGenerationPicker";
import { ResumeSelector } from "@/components/dashboard/generate/ResumeSelector";

/**
 * Inner component that uses useSearchParams
 */
function GeneratePageContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { jdText, setJdText, clearDraft, isDraftSaved } = useDraftJd();
	const { resume } = useUserResume();
	const { jobs } = useGenerations();

	const [isGenerating, setIsGenerating] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isNoCredits, setIsNoCredits] = useState(false);
	const hasLoadedFromJobRef = useRef(false);

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
	}, [searchParams, jobs, setJdText]);

	// Fetch JD from a specific job (for duplicate action)
	const fetchJobJd = async (jobId: string) => {
		try {
			const { supabaseBrowser } = await import("@/lib/supabase/browser");
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
	};

	// Get most recent JD for "Use last JD" button
	const lastJd = jobs.length > 0 ? jobs[0].jd_text : null;

	const handleUseLastJd = () => {
		if (lastJd) {
			setJdText(lastJd);
		}
	};

	const handleSelectFromPast = (selectedJd: string) => {
		setJdText(selectedJd);
	};

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

		if (!resume?.resumeObjectPath) {
			setError("Please upload a resume first");
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
					resumeObjectPath: resume.resumeObjectPath,
					mode: "quick",
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
		jdText.trim().length >= 50 &&
		!!resume?.resumeObjectPath &&
		!isGenerating;

	return (
		<>
			{/* Main Card */}
			<div className="rounded-xl border border-border/50 bg-card/50 p-6">
				{/* Resume Selector */}
				<div className="mb-6">
					<label className="mb-2 block text-sm font-medium text-foreground">
						Resume
					</label>
					<ResumeSelector />
				</div>

				{/* JD Textarea */}
				<div className="mb-4">
					<div className="mb-2 flex items-center justify-between">
						<label className="text-sm font-medium text-foreground">
							Job Description
						</label>
						{isDraftSaved && jdText.trim() && (
							<span className="flex items-center gap-1 text-xs text-emerald-400">
								<Check size={12} />
								Draft saved
							</span>
						)}
					</div>
					<Textarea
						placeholder="Paste the job description here..."
						value={jdText}
						onChange={(e) => setJdText(e.target.value)}
						rows={12}
						className="resize-none font-mono text-sm"
					/>
				</div>

				{/* JD Quality Indicator */}
				{jdText.trim().length > 0 && (
					<div className="mb-4">
						<JdQualityIndicator
							characterCount={jdText.trim().length}
						/>
					</div>
				)}

				{/* Helper Actions */}
				<div className="mb-6 flex flex-wrap gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={handleUseLastJd}
						disabled={!lastJd || isGenerating}
						className="gap-2"
					>
						<RotateCcw size={16} />
						Use last JD
					</Button>
					<PastGenerationPicker
						onSelect={handleSelectFromPast}
						disabled={isGenerating}
					/>
					{jdText.trim() && (
						<Button
							variant="ghost"
							size="sm"
							onClick={handleClear}
							disabled={isGenerating}
						>
							Clear
						</Button>
					)}
				</div>

				{/* Error Display */}
				{error && (
					<div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3">
						<div className="flex items-start gap-2">
							<AlertCircle
								size={16}
								className="mt-0.5 flex-shrink-0 text-red-400"
							/>
							<div className="flex-1">
								<p className="text-sm text-red-400">{error}</p>
								{isNoCredits && (
									<Link href="/dashboard/credits">
										<Button
											variant="link"
											size="sm"
											className="h-auto p-0 text-red-400 underline"
										>
											Get more credits →
										</Button>
									</Link>
								)}
							</div>
						</div>
					</div>
				)}

				{/* Generate Button */}
				<Button
					size="lg"
					onClick={handleGenerate}
					disabled={!canGenerate}
					className="w-full gap-2"
				>
					{isGenerating ? (
						<>
							<Loader2 size={18} className="animate-spin" />
							Generating...
						</>
					) : (
						<>
							<Sparkles size={18} />
							Generate Resume
						</>
					)}
				</Button>
			</div>
		</>
	);
}

/**
 * Loading fallback for Suspense
 */
function GeneratePageSkeleton() {
	return (
		<div className="rounded-xl border border-border/50 bg-card/50 p-6">
			<div className="mb-6 space-y-2">
				<Skeleton className="h-4 w-16" />
				<Skeleton className="h-16 w-full" />
			</div>
			<div className="mb-4 space-y-2">
				<Skeleton className="h-4 w-24" />
				<Skeleton className="h-64 w-full" />
			</div>
			<div className="mb-6 flex gap-2">
				<Skeleton className="h-9 w-28" />
				<Skeleton className="h-9 w-40" />
			</div>
			<Skeleton className="h-11 w-full" />
		</div>
	);
}

/**
 * Main page component with Suspense boundary
 */
export default function GeneratePage() {
	return (
		<div className="p-6 md:p-8">
			{/* Header */}
			<div className="mb-6">
				<h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
					Generate
				</h1>
				<p className="mt-2 text-muted-foreground">
					Create an ATS-optimized resume tailored to a job
					description.
				</p>
			</div>

			<Suspense fallback={<GeneratePageSkeleton />}>
				<GeneratePageContent />
			</Suspense>
		</div>
	);
}
