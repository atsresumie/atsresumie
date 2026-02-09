"use client";

import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, Loader2, RotateCcw } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingState } from "@/components/shared/LoadingState";
import { cn } from "@/lib/utils";
import { EditorControls } from "./EditorControls";
import { deriveRenderPayloadFromResumeText } from "./renderPayload";
import { ResumePreview, type ResumePreviewHandle } from "./ResumePreview";
import { exportResumePagesToPdf } from "./exportPdf";
import {
	DEFAULT_EDITOR_FILENAME,
	DEFAULT_EDITOR_SETTINGS,
	type EditorSettings,
	type RenderPayload,
} from "./types";

interface ResumeEditorShellProps {
	jobId: string;
}

interface EditorJobRecord {
	id: string;
	jd_text: string | null;
	resume_text: string | null;
	resume_object_path: string | null;
}

function storageKeyForJob(jobId: string): string {
	return `atsresumie_editor_settings_${jobId}`;
}

function parseStoredSettings(raw: string | null): EditorSettings | null {
	if (!raw) return null;

	try {
		const parsed = JSON.parse(raw) as Partial<EditorSettings>;
		return {
			...DEFAULT_EDITOR_SETTINGS,
			...parsed,
		};
	} catch {
		return null;
	}
}

export function ResumeEditorShell({ jobId }: ResumeEditorShellProps) {
	const router = useRouter();
	const previewRef = useRef<ResumePreviewHandle>(null);

	const [payload, setPayload] = useState<RenderPayload | null>(null);
	const [settings, setSettings] = useState<EditorSettings>(
		DEFAULT_EDITOR_SETTINGS,
	);
	const [fileName, setFileName] = useState(DEFAULT_EDITOR_FILENAME);
	const [isLoading, setIsLoading] = useState(true);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [downloadError, setDownloadError] = useState<string | null>(null);
	const [isDownloading, setIsDownloading] = useState(false);
	const [hydratedSettings, setHydratedSettings] = useState(false);

	const localStorageKey = useMemo(() => storageKeyForJob(jobId), [jobId]);

	useEffect(() => {
		if (typeof window === "undefined") return;

		const persisted = parseStoredSettings(localStorage.getItem(localStorageKey));
		setSettings(persisted || DEFAULT_EDITOR_SETTINGS);
		setHydratedSettings(true);
	}, [localStorageKey]);

	useEffect(() => {
		if (!hydratedSettings || typeof window === "undefined") return;
		localStorage.setItem(localStorageKey, JSON.stringify(settings));
	}, [hydratedSettings, localStorageKey, settings]);

	const loadEditorData = useCallback(async () => {
		setIsLoading(true);
		setLoadError(null);
		setDownloadError(null);

		try {
			const supabase = supabaseBrowser();
			const { data: jobData, error: jobError } = await supabase
				.from("generation_jobs")
				.select("id, jd_text, resume_text, resume_object_path")
				.eq("id", jobId)
				.maybeSingle();

			if (jobError) {
				throw jobError;
			}

			const job = jobData as EditorJobRecord | null;
			if (!job) {
				setLoadError("Generation not found or you do not have access.");
				setPayload(null);
				return;
			}

			let sourceResumeText = job.resume_text?.trim() || "";

			if (!sourceResumeText && job.resume_object_path) {
				const { data: resumeVersion, error: resumeError } = await supabase
					.from("resume_versions")
					.select("resume_text")
					.eq("object_path", job.resume_object_path)
					.order("created_at", { ascending: false })
					.limit(1)
					.maybeSingle();

				if (!resumeError) {
					sourceResumeText =
						(resumeVersion?.resume_text as string | null)?.trim() || "";
				}
			}

			if (!sourceResumeText) {
				setLoadError(
					"This generation does not include resume source text for local editing.",
				);
				setPayload(null);
				return;
			}

			setPayload(
				deriveRenderPayloadFromResumeText(sourceResumeText, job.jd_text),
			);
		} catch (error) {
			console.error("[ResumeEditorShell] Failed to load job", error);
			setLoadError(
				error instanceof Error
					? error.message
					: "Unable to load this generation.",
			);
			setPayload(null);
		} finally {
			setIsLoading(false);
		}
	}, [jobId]);

	useEffect(() => {
		loadEditorData();
	}, [loadEditorData]);

	const handleBack = () => {
		if (typeof window !== "undefined" && window.history.length > 1) {
			router.back();
			return;
		}
		router.push("/dashboard/generations");
	};

	const handleReset = () => {
		setSettings(DEFAULT_EDITOR_SETTINGS);
		setFileName(DEFAULT_EDITOR_FILENAME);
		setDownloadError(null);
		if (typeof window !== "undefined") {
			localStorage.removeItem(localStorageKey);
		}
	};

	const handleDownload = async () => {
		if (!payload) return;

		setIsDownloading(true);
		setDownloadError(null);
		try {
			const pageElements = previewRef.current?.getPageElements() || [];
			await exportResumePagesToPdf({
				pageElements,
				fileName,
				pageSize: settings.pageSize,
			});
		} catch (error) {
			console.error("[ResumeEditorShell] PDF export failed", error);
			setDownloadError(
				error instanceof Error
					? error.message
					: "Failed to export PDF.",
			);
		} finally {
			setIsDownloading(false);
		}
	};

	if (isLoading) {
		return (
			<div className="h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)]">
				<LoadingState
					title="Loading editor"
					message="Preparing your local resume canvas..."
					className="h-full"
				/>
			</div>
		);
	}

	if (loadError || !payload) {
		return (
			<div className="h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)]">
				<div className="flex h-full flex-col">
					<div className="border-b border-border-subtle bg-surface-inset/70 px-4 py-3">
						<Button
							variant="ghost"
							size="sm"
							onClick={handleBack}
							className="w-fit"
						>
							<ArrowLeft size={16} />
							Back
						</Button>
					</div>
					<ErrorState
						title="Editor unavailable"
						message={loadError || "Unable to render this generation."}
						onRetry={loadEditorData}
						className="h-full"
					/>
				</div>
			</div>
		);
	}

	return (
		<div className="h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)]">
			<div className="flex h-full flex-col bg-surface-base text-text-primary">
				<header className="border-b border-border-subtle bg-surface-inset/70 px-4 py-3 md:px-6">
					<div className="flex flex-wrap items-center gap-3">
						<Button variant="ghost" size="sm" onClick={handleBack}>
							<ArrowLeft size={16} />
							Back
						</Button>

						<div className="min-w-[220px] flex-1 md:max-w-lg">
							<label
								htmlFor="editor-file-name"
								className="mb-1 block text-xs uppercase tracking-[0.12em] text-text-secondary"
							>
								Filename
							</label>
							<Input
								id="editor-file-name"
								value={fileName}
								onChange={(event) => setFileName(event.target.value)}
								placeholder={DEFAULT_EDITOR_FILENAME}
								className="h-9"
							/>
						</div>

						<div className="ml-auto flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={handleReset}
							>
								<RotateCcw size={16} />
								Reset
							</Button>
							<Button
								size="sm"
								onClick={handleDownload}
								disabled={isDownloading}
							>
								{isDownloading ? (
									<Loader2 size={16} className="animate-spin motion-reduce:animate-none" />
								) : (
									<Download size={16} />
								)}
								Download PDF
							</Button>
						</div>
					</div>

					{downloadError && (
						<p className="mt-2 text-xs text-error">{downloadError}</p>
					)}
				</header>

				<div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[320px_1fr]">
					<EditorControls settings={settings} onChange={setSettings} />
					<div className={cn("min-h-0 bg-surface-base")}>
						<ResumePreview ref={previewRef} payload={payload} settings={settings} />
					</div>
				</div>
			</div>
		</div>
	);
}
