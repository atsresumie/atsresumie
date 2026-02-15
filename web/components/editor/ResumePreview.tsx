"use client";

import { forwardRef } from "react";
import { ResumeContent } from "./ResumeContent";
import type { RenderPayload, EditorSettings } from "@/types/editor";
import { PAGE_DIMENSIONS } from "@/types/editor";

interface ResumePreviewProps {
	payload: RenderPayload;
	settings: EditorSettings;
}

// Convert mm to px (96 DPI)
const MM_TO_PX = 96 / 25.4;

/**
 * Paginated resume preview with LaTeX-matching styling
 * Uses 0.6-0.8in margins as per LaTeX template (default ~0.75in = 19mm)
 */
export const ResumePreview = forwardRef<HTMLDivElement, ResumePreviewProps>(
	function ResumePreview({ payload, settings }, ref) {
		const dimensions = PAGE_DIMENSIONS[settings.pageSize];
		const pageWidth = dimensions.width * MM_TO_PX;
		const pageHeight = dimensions.height * MM_TO_PX;

		// Calculate content area using settings margins
		const contentPaddingTop = settings.marginTop * MM_TO_PX;
		const contentPaddingBottom = settings.marginBottom * MM_TO_PX;
		const contentPaddingLeft = settings.marginLeft * MM_TO_PX;
		const contentPaddingRight = settings.marginRight * MM_TO_PX;

		return (
			<div ref={ref} className="flex flex-col items-center gap-6">
				{/* Single page - matches Letter/A4 dimensions */}
				<div
					data-page="1"
					className="relative bg-white shadow-md"
					style={{
						width: pageWidth,
						minHeight: pageHeight,
					}}
				>
					{/* Content area with margins */}
					<div
						className="relative"
						style={{
							padding: `${contentPaddingTop}px ${contentPaddingRight}px ${contentPaddingBottom}px ${contentPaddingLeft}px`,
						}}
					>
						<ResumeContent payload={payload} settings={settings} />
					</div>
				</div>
			</div>
		);
	},
);
