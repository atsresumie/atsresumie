"use client";

import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { supabaseBrowser } from "@/lib/supabase/browser";
import {
	latexToPlainText,
	buildTxtFilename,
	downloadTextFile,
} from "@/lib/export/latexToPlainText";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ExportFormat = "pdf" | "txt" | "docx";

const ENABLED_FORMATS: ExportFormat[] = ["pdf", "txt"];
const STORAGE_KEY = "atsresumie_export_format";

interface ExportModalState {
	isOpen: boolean;
	jobId: string | null;
	jobLabel: string;
	/** Pre-loaded latex (avoids fetch when already available, e.g. editor page) */
	latexText: string | null;
}

export interface UseExportModalReturn {
	// Modal state
	isOpen: boolean;
	jobId: string | null;
	jobLabel: string;
	selectedFormat: ExportFormat;
	setSelectedFormat: (f: ExportFormat) => void;
	isExporting: boolean;

	// Actions
	openModal: (
		jobId: string,
		jobLabel: string,
		latexText?: string | null,
	) => void;
	closeModal: () => void;
	handleExport: (onExportPdf: () => Promise<void>) => Promise<void>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Shared hook for managing the Export Modal state across all entry points.
 *
 * - Persists last-selected format in localStorage (enabled formats only).
 * - PDF delegation: calls the provided `onExportPdf` callback (preserves
 *   existing per-entry-point behavior).
 * - TXT generation: fetches latex_text from DB if not already available,
 *   converts to plain text, triggers browser download.
 * - DOCX: not yet supported; blocked before reaching this hook.
 */
export function useExportModal(): UseExportModalReturn {
	// ----- modal visibility / metadata -----
	const [state, setState] = useState<ExportModalState>({
		isOpen: false,
		jobId: null,
		jobLabel: "",
		latexText: null,
	});

	// ----- format selection -----
	const [selectedFormat, setSelectedFormatRaw] = useState<ExportFormat>(
		() => {
			if (typeof window === "undefined") return "pdf";
			const stored = localStorage.getItem(
				STORAGE_KEY,
			) as ExportFormat | null;
			// Only honour stored value if it's an enabled format
			if (stored && ENABLED_FORMATS.includes(stored)) return stored;
			return "pdf";
		},
	);

	const setSelectedFormat = useCallback((format: ExportFormat) => {
		setSelectedFormatRaw(format);
		// Persist only enabled formats
		if (ENABLED_FORMATS.includes(format)) {
			localStorage.setItem(STORAGE_KEY, format);
		}
	}, []);

	// ----- export in progress -----
	const [isExporting, setIsExporting] = useState(false);
	const exportingRef = useRef(false); // double-click guard

	// ----- open / close -----
	const openModal = useCallback(
		(jobId: string, jobLabel: string, latexText?: string | null) => {
			setState({
				isOpen: true,
				jobId,
				jobLabel: jobLabel || "Resume",
				latexText: latexText ?? null,
			});
		},
		[],
	);

	const closeModal = useCallback(() => {
		if (exportingRef.current) return; // don't close while exporting
		setState((s) => ({ ...s, isOpen: false }));
	}, []);

	// ----- export dispatcher -----
	const handleExport = useCallback(
		async (onExportPdf: () => Promise<void>) => {
			if (exportingRef.current) return; // double-click guard
			exportingRef.current = true;
			setIsExporting(true);

			try {
				switch (selectedFormat) {
					case "pdf": {
						await onExportPdf();
						break;
					}

					case "txt": {
						// Resolve latex source
						let latex = state.latexText;

						if (!latex && state.jobId) {
							// Fetch from DB
							const supabase = supabaseBrowser();
							const { data, error } = await supabase
								.from("generation_jobs")
								.select("latex_text")
								.eq("id", state.jobId)
								.single();

							if (error || !data?.latex_text) {
								toast.error(
									"Text export unavailable for this resume yet.",
									{
										description:
											"Try exporting PDF first or regenerate.",
									},
								);
								return; // keep modal open
							}

							latex = data.latex_text;
						}

						if (!latex) {
							toast.error(
								"Text export unavailable for this resume yet.",
								{
									description:
										"Try exporting PDF first or regenerate.",
								},
							);
							return;
						}

						const plainText = latexToPlainText(latex);
						const filename = buildTxtFilename(state.jobLabel);
						downloadTextFile(plainText, filename);

						toast.success("TXT downloaded!", {
							description: filename,
						});

						// Close modal on success
						setState((s) => ({ ...s, isOpen: false }));
						break;
					}

					case "docx": {
						// Should be unreachable (disabled in UI)
						toast.info("DOCX export is coming soon.");
						return;
					}
				}
			} catch (err) {
				console.error("Export failed:", err);
				toast.error("Export failed", {
					description:
						err instanceof Error
							? err.message
							: "Please try again.",
				});
				// Modal stays open on error
			} finally {
				setIsExporting(false);
				exportingRef.current = false;
			}
		},
		[selectedFormat, state.latexText, state.jobId, state.jobLabel],
	);

	return {
		isOpen: state.isOpen,
		jobId: state.jobId,
		jobLabel: state.jobLabel,
		selectedFormat,
		setSelectedFormat,
		isExporting,
		openModal,
		closeModal,
		handleExport,
	};
}
