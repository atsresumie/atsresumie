"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Loader2, AlertCircle } from "lucide-react";

// PDF.js types
import type { PDFDocumentProxy } from "pdfjs-dist";

export const ZOOM_MIN = 0.5;
export const ZOOM_MAX = 3.0;
export const ZOOM_STEP = 0.1;
export const ZOOM_DEFAULT = 1.0;

interface PdfJsPreviewProps {
	url: string | null;
	isLoading?: boolean;
	className?: string;
	zoom?: number;
	onZoomChange?: (zoom: number) => void;
}

/**
 * PDF.js-based preview component.
 * Renders ALL pages vertically in a scrollable container with zoom support.
 */
export function PdfJsPreview({
	url,
	isLoading = false,
	className = "",
	zoom = ZOOM_DEFAULT,
	onZoomChange,
}: PdfJsPreviewProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const scrollRef = useRef<HTMLDivElement>(null);
	const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
	const [totalPages, setTotalPages] = useState(0);
	const [error, setError] = useState<string | null>(null);
	const [isLoadingPdf, setIsLoadingPdf] = useState(false);
	const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
	const [renderKey, setRenderKey] = useState(0);

	// Ctrl/Cmd + scroll wheel zoom (only inside PDF area)
	useEffect(() => {
		const scrollEl = scrollRef.current;
		if (!scrollEl || !onZoomChange) return;

		const handleWheel = (e: WheelEvent) => {
			if (e.ctrlKey || e.metaKey) {
				e.preventDefault();
				const delta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
				const next = Math.min(
					ZOOM_MAX,
					Math.max(ZOOM_MIN, Math.round((zoom + delta) * 100) / 100),
				);
				onZoomChange(next);
			}
		};

		scrollEl.addEventListener("wheel", handleWheel, { passive: false });
		return () => scrollEl.removeEventListener("wheel", handleWheel);
	}, [zoom, onZoomChange]);

	// Load PDF.js dynamically (client-side only)
	const loadPdf = useCallback(async (pdfUrl: string) => {
		setIsLoadingPdf(true);
		setError(null);

		try {
			const pdfjs = await import("pdfjs-dist");

			if (typeof window !== "undefined") {
				pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
			}

			const loadingTask = pdfjs.getDocument(pdfUrl);
			const pdf = await loadingTask.promise;

			setPdfDoc(pdf);
			setTotalPages(pdf.numPages);
		} catch (err) {
			console.error("PDF load error:", err);
			setError(err instanceof Error ? err.message : "Failed to load PDF");
			setPdfDoc(null);
		} finally {
			setIsLoadingPdf(false);
		}
	}, []);

	// Load PDF when URL changes
	useEffect(() => {
		if (url) {
			loadPdf(url);
		} else {
			setPdfDoc(null);
			setTotalPages(0);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [url, loadPdf]);

	// Render ALL pages at current zoom level
	useEffect(() => {
		if (!pdfDoc || totalPages === 0) return;

		const renderAllPages = async () => {
			const containerWidth = containerRef.current?.clientWidth || 600;

			for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
				try {
					const page = await pdfDoc.getPage(pageNum);
					const canvas = canvasRefs.current.get(pageNum);
					if (!canvas) continue;

					const ctx = canvas.getContext("2d");
					if (!ctx) continue;

					const viewport = page.getViewport({ scale: 1 });
					// Base scale fits the container width, then multiply by zoom
					const baseScale = (containerWidth - 48) / viewport.width;
					const scale = baseScale * zoom;
					const scaledViewport = page.getViewport({ scale });

					canvas.width = scaledViewport.width;
					canvas.height = scaledViewport.height;

					await page.render({
						canvasContext: ctx,
						viewport: scaledViewport,
					}).promise;
				} catch (err) {
					console.error(`Page ${pageNum} render error:`, err);
				}
			}
		};

		const timer = setTimeout(renderAllPages, 50);
		return () => clearTimeout(timer);
	}, [pdfDoc, totalPages, renderKey, zoom]);

	// Re-render on window resize
	useEffect(() => {
		if (!pdfDoc) return;

		const handleResize = () => setRenderKey((k) => k + 1);
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, [pdfDoc]);

	// Register canvas ref
	const setCanvasRef = useCallback(
		(pageNum: number) => (el: HTMLCanvasElement | null) => {
			if (el) {
				canvasRefs.current.set(pageNum, el);
			} else {
				canvasRefs.current.delete(pageNum);
			}
		},
		[],
	);

	// Loading state
	if (isLoading || isLoadingPdf) {
		return (
			<div
				className={`flex h-full items-center justify-center bg-neutral-100 dark:bg-neutral-900 ${className}`}
			>
				<div className="flex flex-col items-center gap-3 text-text-secondary">
					<Loader2 className="h-8 w-8 animate-spin" />
					<span className="text-sm">
						{isLoading ? "Recompiling…" : "Loading PDF…"}
					</span>
				</div>
			</div>
		);
	}

	// Error state
	if (error) {
		return (
			<div
				className={`flex h-full items-center justify-center bg-neutral-100 dark:bg-neutral-900 ${className}`}
			>
				<div className="flex flex-col items-center gap-3 text-red-400">
					<AlertCircle className="h-8 w-8" />
					<span className="text-sm">{error}</span>
				</div>
			</div>
		);
	}

	// No URL state
	if (!url) {
		return (
			<div
				className={`flex h-full items-center justify-center bg-neutral-100 dark:bg-neutral-900 ${className}`}
			>
				<div className="text-center text-text-secondary">
					<p className="text-sm">No PDF available</p>
					<p className="mt-1 text-xs">
						Generate a resume to see the preview
					</p>
				</div>
			</div>
		);
	}

	return (
		<div
			ref={containerRef}
			className={`relative flex h-full flex-col bg-neutral-100 dark:bg-neutral-900 ${className}`}
		>
			{/* Scrollable pages container — absolute inset to get real height */}
			<div ref={scrollRef} className="absolute inset-0 overflow-auto p-4">
				<div className="flex flex-col items-center gap-6 pb-16">
					{Array.from({ length: totalPages }, (_, i) => i + 1).map(
						(pageNum) => (
							<div key={pageNum} className="relative">
								<canvas
									ref={setCanvasRef(pageNum)}
									className="rounded-sm shadow-lg"
									style={{ backgroundColor: "white" }}
								/>
								{totalPages > 1 && (
									<span className="absolute bottom-2 right-2 rounded bg-black/50 px-2 py-0.5 text-xs text-white">
										{pageNum} / {totalPages}
									</span>
								)}
							</div>
						),
					)}
				</div>
			</div>
		</div>
	);
}
