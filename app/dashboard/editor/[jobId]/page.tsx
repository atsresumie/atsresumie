"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { useAuth } from "@/hooks/useAuth";
import { EditorLoadingState } from "@/components/editor/EditorLoadingState";
import { EditorErrorState } from "@/components/editor/EditorErrorState";
import {
	PdfJsPreview,
	ZOOM_MIN,
	ZOOM_MAX,
	ZOOM_STEP,
	ZOOM_DEFAULT,
} from "@/components/editor/PdfJsPreview";
import { StyleControls } from "@/components/editor/StyleControls";
import {
	ArrowLeft,
	Download,
	Loader2,
	RefreshCw,
	ZoomIn,
	ZoomOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	type StyleConfig,
	DEFAULT_STYLE_CONFIG,
	STYLE_CONFIG_STORAGE_KEY_PREFIX,
} from "@/types/editor";
import { parseStyleFromLatex } from "@/lib/latex/applyStyleToLatex";

const FILENAME_STORAGE_KEY_PREFIX = "atsresumie_editor_filename_";

/**
 * PDF-First Resume Editor Page
 *
 * Shows pixel-perfect PDF preview using PDF.js.
 * Users can adjust style knobs and click "Update Preview" to regenerate.
 * Download saves the currently previewed PDF with custom filename.
 */
export default function EditorPage() {
	const params = useParams();
	const jobId = params.jobId as string;
	const { isAuthenticated, isLoading: authLoading, user } = useAuth();

	// Page state
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [hasLatexText, setHasLatexText] = useState(false);

	// PDF state
	const [pdfUrl, setPdfUrl] = useState<string | null>(null);
	const [isUpdating, setIsUpdating] = useState(false);
	const [updateError, setUpdateError] = useState<string | null>(null);

	// Style config state
	const [styleConfig, setStyleConfig] =
		useState<StyleConfig>(DEFAULT_STYLE_CONFIG);

	// Filename state
	const [filename, setFilename] = useState("ATSResumie_Resume");
	const [isDownloading, setIsDownloading] = useState(false);

	// Zoom state
	const [zoom, setZoom] = useState(ZOOM_DEFAULT);

	// Load saved state from localStorage
	useEffect(() => {
		if (!jobId) return;

		// Load filename
		const storedFilename = localStorage.getItem(
			`${FILENAME_STORAGE_KEY_PREFIX}${jobId}`,
		);
		if (storedFilename) setFilename(storedFilename);

		// Load style config
		const storedConfig = localStorage.getItem(
			`${STYLE_CONFIG_STORAGE_KEY_PREFIX}${jobId}`,
		);
		if (storedConfig) {
			try {
				const parsed = JSON.parse(storedConfig);
				setStyleConfig({ ...DEFAULT_STYLE_CONFIG, ...parsed });
			} catch {
				// Ignore invalid JSON
			}
		}
	}, [jobId]);

	// Save filename to localStorage
	useEffect(() => {
		if (!jobId || isLoading) return;
		localStorage.setItem(
			`${FILENAME_STORAGE_KEY_PREFIX}${jobId}`,
			filename,
		);
	}, [jobId, filename, isLoading]);

	// Save style config to localStorage
	useEffect(() => {
		if (!jobId || isLoading) return;
		localStorage.setItem(
			`${STYLE_CONFIG_STORAGE_KEY_PREFIX}${jobId}`,
			JSON.stringify(styleConfig),
		);
	}, [jobId, styleConfig, isLoading]);

	// Fetch initial PDF URL via /api/export-pdf (uses supabaseAdmin for signed URL)
	const fetchInitialPdfUrl = useCallback(async () => {
		if (!isAuthenticated || !user?.id || !jobId) return;

		setIsLoading(true);
		setError(null);

		try {
			const supabase = supabaseBrowser();

			// Get job metadata (status + latex_text presence)
			const { data: job, error: jobError } = await supabase
				.from("generation_jobs")
				.select("id, user_id, status, pdf_object_path, latex_text")
				.eq("id", jobId)
				.eq("user_id", user.id)
				.single();

			if (jobError || !job) {
				throw new Error("Generation not found or access denied");
			}

			if (job.status !== "succeeded") {
				throw new Error(
					"This generation has not completed successfully",
				);
			}

			setHasLatexText(!!job.latex_text);

			// Parse initial style from LaTeX if no saved config in localStorage
			const storedConfig = localStorage.getItem(
				`${STYLE_CONFIG_STORAGE_KEY_PREFIX}${jobId}`,
			);
			if (!storedConfig && job.latex_text) {
				const parsed = parseStyleFromLatex(job.latex_text);
				setStyleConfig(parsed);
			}

			if (!job.pdf_object_path) {
				throw new Error("PDF not available for this generation");
			}

			// Get signed URL via API (uses supabaseAdmin - no RLS issues)
			const res = await fetch("/api/export-pdf", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ jobId }),
			});

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || "Failed to load PDF preview");
			}

			const { pdfUrl: signedUrl } = await res.json();
			setPdfUrl(signedUrl);
		} catch (err) {
			console.error("Failed to load PDF:", err);
			setError(err instanceof Error ? err.message : "Failed to load PDF");
		} finally {
			setIsLoading(false);
		}
	}, [isAuthenticated, user?.id, jobId]);

	// Initial load
	useEffect(() => {
		if (!authLoading) fetchInitialPdfUrl();
	}, [authLoading, fetchInitialPdfUrl]);

	// Recompile - compile with style config
	const recompileTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
		null,
	);
	const hasLoadedRef = useRef(false);

	const recompile = useCallback(
		async (config: StyleConfig) => {
			if (!hasLatexText || isUpdating) return;

			setIsUpdating(true);
			setUpdateError(null);

			try {
				const res = await fetch("/api/export-pdf-with-style", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ jobId, styleConfig: config }),
				});

				if (!res.ok) {
					const data = await res.json();
					throw new Error(data.error || "Recompile failed");
				}

				const { pdfUrl: newPdfUrl } = await res.json();
				setPdfUrl(newPdfUrl);
			} catch (err) {
				console.error("Recompile error:", err);
				setUpdateError(
					err instanceof Error ? err.message : "Recompile failed",
				);
			} finally {
				setIsUpdating(false);
			}
			// eslint-disable-next-line react-hooks/exhaustive-deps
		},
		[hasLatexText, jobId],
	);

	// Auto-recompile on style changes (debounced 800ms)
	useEffect(() => {
		// Skip initial load and while page is still loading
		if (!hasLoadedRef.current || isLoading) {
			return;
		}

		if (recompileTimerRef.current) {
			clearTimeout(recompileTimerRef.current);
		}

		recompileTimerRef.current = setTimeout(() => {
			recompile(styleConfig);
		}, 800);

		return () => {
			if (recompileTimerRef.current) {
				clearTimeout(recompileTimerRef.current);
			}
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [styleConfig]);

	// Mark loaded after initial PDF fetch completes
	useEffect(() => {
		if (!isLoading && pdfUrl) {
			// Small delay so saved config restore doesn't trigger recompile
			const t = setTimeout(() => {
				hasLoadedRef.current = true;
			}, 200);
			return () => clearTimeout(t);
		}
	}, [isLoading, pdfUrl]);

	// Handle style config change
	const handleStyleChange = (newConfig: StyleConfig) => {
		setStyleConfig(newConfig);
	};

	// Handle reset to defaults (also triggers auto-recompile via effect)
	const handleReset = () => {
		setStyleConfig(DEFAULT_STYLE_CONFIG);
	};

	// Handle download — recompile with saveLatex flag then download
	const handleDownload = async () => {
		if (!pdfUrl) return;

		setIsDownloading(true);
		try {
			// Save styled LaTeX to DB via recompile with saveLatex flag
			if (hasLatexText) {
				const saveRes = await fetch("/api/export-pdf-with-style", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						jobId,
						styleConfig,
						saveLatex: true,
					}),
				});

				if (saveRes.ok) {
					const { pdfUrl: freshUrl } = await saveRes.json();
					setPdfUrl(freshUrl);
					// Download the freshly compiled PDF
					const response = await fetch(freshUrl);
					const blob = await response.blob();
					triggerDownload(blob);
					return;
				}
				// If save-compile failed, still download the current preview
				console.warn(
					"Save-compile failed, downloading current preview",
				);
			}

			// Fallback: download whatever is currently previewed
			const response = await fetch(pdfUrl);
			const blob = await response.blob();
			triggerDownload(blob);
		} catch (err) {
			console.error("Download failed:", err);
		} finally {
			setIsDownloading(false);
		}
	};

	const triggerDownload = (blob: Blob) => {
		const downloadUrl = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = downloadUrl;
		link.download = filename.endsWith(".pdf")
			? filename
			: `${filename}.pdf`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(downloadUrl);
	};

	// Loading state
	if (authLoading || isLoading) {
		return <EditorLoadingState />;
	}

	// Error state
	if (error || !pdfUrl) {
		return (
			<EditorErrorState
				error={error || "PDF not available"}
				onRetry={fetchInitialPdfUrl}
			/>
		);
	}

	return (
		<div className="flex h-screen flex-col bg-surface-base">
			{/* Top Bar */}
			<header className="flex h-14 shrink-0 items-center justify-between border-b border-border-subtle bg-surface-raised px-4">
				{/* Left section: Back + Filename */}
				<div className="flex items-center gap-4">
					<Link href="/dashboard/generations">
						<Button variant="ghost" size="sm" className="gap-2">
							<ArrowLeft size={16} />
							<span className="hidden sm:inline">Back</span>
						</Button>
					</Link>

					<div className="h-5 w-px bg-border-subtle" />

					<div className="flex items-center gap-2">
						<label
							htmlFor="filename"
							className="text-sm text-text-secondary"
						>
							Filename:
						</label>
						<Input
							id="filename"
							type="text"
							value={filename}
							onChange={(e) => setFilename(e.target.value)}
							className="h-8 w-48 text-sm"
							placeholder="resume.pdf"
						/>
					</div>
				</div>

				{/* Right section: Actions */}
				<div className="flex items-center gap-2">
					{updateError && (
						<span className="text-xs text-red-400">
							{updateError}
						</span>
					)}

					{/* Zoom controls */}
					<div className="flex items-center gap-1 rounded-md border border-border-subtle px-1">
						<Button
							variant="ghost"
							size="sm"
							onClick={() =>
								setZoom((z) =>
									Math.max(
										ZOOM_MIN,
										Math.round((z - ZOOM_STEP) * 100) / 100,
									),
								)
							}
							disabled={zoom <= ZOOM_MIN}
							className="h-7 w-7 p-0"
							aria-label="Zoom out"
						>
							<ZoomOut size={14} />
						</Button>
						<span className="min-w-[3rem] text-center text-xs tabular-nums text-text-secondary">
							{Math.round(zoom * 100)}%
						</span>
						<Button
							variant="ghost"
							size="sm"
							onClick={() =>
								setZoom((z) =>
									Math.min(
										ZOOM_MAX,
										Math.round((z + ZOOM_STEP) * 100) / 100,
									),
								)
							}
							disabled={zoom >= ZOOM_MAX}
							className="h-7 w-7 p-0"
							aria-label="Zoom in"
						>
							<ZoomIn size={14} />
						</Button>
					</div>

					<div className="h-5 w-px bg-border-subtle" />

					<Button
						variant="outline"
						size="sm"
						onClick={() => recompile(styleConfig)}
						disabled={isUpdating || !hasLatexText}
						className="gap-2"
					>
						{isUpdating ? (
							<Loader2 size={16} className="animate-spin" />
						) : (
							<RefreshCw size={16} />
						)}
						{isUpdating ? "Compiling…" : "Recompile"}
					</Button>

					<Button
						size="sm"
						onClick={handleDownload}
						disabled={isDownloading || !pdfUrl}
						className="gap-2"
					>
						{isDownloading ? (
							<Loader2 size={16} className="animate-spin" />
						) : (
							<Download size={16} />
						)}
						Download PDF
					</Button>
				</div>
			</header>

			{/* Main content: Left panel + Preview */}
			<div className="flex flex-1 overflow-hidden">
				{/* Left panel: Style controls */}
				<aside className="w-72 shrink-0 border-r border-border-subtle bg-surface-raised">
					<StyleControls
						config={styleConfig}
						onChange={handleStyleChange}
						onReset={handleReset}
					/>
				</aside>

				{/* Right panel: PDF preview */}
				<main className="relative flex-1 min-h-0">
					<PdfJsPreview
						url={pdfUrl}
						isLoading={isUpdating}
						zoom={zoom}
						onZoomChange={setZoom}
					/>
				</main>
			</div>
		</div>
	);
}
