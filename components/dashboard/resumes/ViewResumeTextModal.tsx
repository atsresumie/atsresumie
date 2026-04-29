"use client";

import { useEffect, useState, useCallback } from "react";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ResumePreviewCard } from "@/components/dashboard/resumes/ResumePreviewCard";

const BASE_PREVIEW_WIDTH_PX = 480;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2.5;
const ZOOM_STEP = 0.1;
const ZOOM_DEFAULT = 1.4;

interface ViewResumeTextModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	resumeLabel: string;
	resumeText: string | null;
}

export function ViewResumeTextModal({
	open,
	onOpenChange,
	resumeLabel,
	resumeText,
}: ViewResumeTextModalProps) {
	const [zoom, setZoom] = useState(ZOOM_DEFAULT);

	useEffect(() => {
		if (open) setZoom(ZOOM_DEFAULT);
	}, [open]);

	const zoomIn = useCallback(() => {
		setZoom((z) =>
			Math.min(ZOOM_MAX, Math.round((z + ZOOM_STEP) * 100) / 100),
		);
	}, []);

	const zoomOut = useCallback(() => {
		setZoom((z) =>
			Math.max(ZOOM_MIN, Math.round((z - ZOOM_STEP) * 100) / 100),
		);
	}, []);

	const resetZoom = useCallback(() => setZoom(ZOOM_DEFAULT), []);

	const previewWidthPx = Math.round(BASE_PREVIEW_WIDTH_PX * zoom);
	const canZoomIn = zoom < ZOOM_MAX - 1e-6;
	const canZoomOut = zoom > ZOOM_MIN + 1e-6;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
				<DialogHeader className="shrink-0">
					<DialogTitle>{resumeLabel}</DialogTitle>
					<DialogDescription>
						Read-only preview — same layout as a PDF page (not editable)
					</DialogDescription>
				</DialogHeader>

				{resumeText ? (
					<div className="flex min-h-0 flex-1 flex-col gap-3">
						<div className="flex shrink-0 flex-wrap items-center justify-center gap-2">
							<Button
								type="button"
								variant="outline"
								size="icon"
								className="h-9 w-9"
								onClick={zoomOut}
								disabled={!canZoomOut}
								aria-label="Zoom out"
							>
								<ZoomOut className="h-4 w-4" />
							</Button>
							<span className="text-xs font-medium text-text-secondary tabular-nums min-w-[3.25rem] text-center">
								{Math.round(zoom * 100)}%
							</span>
							<Button
								type="button"
								variant="outline"
								size="icon"
								className="h-9 w-9"
								onClick={zoomIn}
								disabled={!canZoomIn}
								aria-label="Zoom in"
							>
								<ZoomIn className="h-4 w-4" />
							</Button>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="h-9 gap-1.5 text-text-secondary"
								onClick={resetZoom}
								disabled={zoom === ZOOM_DEFAULT}
							>
								<RotateCcw className="h-3.5 w-3.5" />
								Reset
							</Button>
						</div>

						<div className="min-h-0 flex-1 overflow-y-auto overflow-x-auto rounded-lg border border-border-visible bg-surface-inset/50">
							<div className="flex min-w-min justify-center p-4">
								<ResumePreviewCard
									resumeText={resumeText}
									label={resumeLabel}
									previewWidthPx={previewWidthPx}
									hideHeader
									centerPreview
									className="border-0 shadow-none p-0 w-max max-w-none"
								/>
							</div>
						</div>
					</div>
				) : (
					<div className="overflow-auto max-h-[75vh] w-full">
						<div className="flex w-full justify-center px-2 pb-6 pt-1">
							<ResumePreviewCard
								resumeText={null}
								label={resumeLabel}
								emptyHint="No extracted text available for this resume."
								hideHeader
								centerPreview
								className="border-0 shadow-none p-0 w-full max-w-lg"
							/>
						</div>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
