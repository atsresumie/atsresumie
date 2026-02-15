/**
 * Client-side PDF export utility
 * Uses html2canvas + jsPDF to generate multi-page PDFs
 */

import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import type { PageSize } from "@/types/editor";
import { PAGE_DIMENSIONS } from "@/types/editor";

interface ExportOptions {
	filename: string;
	pageSize: PageSize;
	pageElements: HTMLElement[];
}

/**
 * Export resume pages to PDF
 */
export async function exportPdf({
	filename,
	pageSize,
	pageElements,
}: ExportOptions): Promise<void> {
	if (pageElements.length === 0) {
		throw new Error("No pages to export");
	}

	const dimensions = PAGE_DIMENSIONS[pageSize];
	const orientation =
		dimensions.width > dimensions.height ? "landscape" : "portrait";

	// Create PDF with correct dimensions
	const pdf = new jsPDF({
		orientation,
		unit: "mm",
		format: [dimensions.width, dimensions.height],
	});

	// Scale for quality - cap at 2 to avoid massive file sizes
	const scale = Math.min(2, window.devicePixelRatio || 2);

	for (let i = 0; i < pageElements.length; i++) {
		const element = pageElements[i];

		// Capture page as canvas
		const canvas = await html2canvas(element, {
			scale,
			useCORS: true,
			logging: false,
			backgroundColor: "#ffffff",
		});

		// Convert to image
		const imgData = canvas.toDataURL("image/jpeg", 0.95);

		// Add new page if not first
		if (i > 0) {
			pdf.addPage([dimensions.width, dimensions.height], orientation);
		}

		// Add image to PDF (full page)
		pdf.addImage(
			imgData,
			"JPEG",
			0,
			0,
			dimensions.width,
			dimensions.height,
		);
	}

	// Ensure filename ends with .pdf
	const finalFilename = filename.endsWith(".pdf")
		? filename
		: `${filename}.pdf`;

	// Download
	pdf.save(finalFilename);
}

/**
 * Get all page elements from the preview container
 */
export function getPageElements(containerRef: HTMLElement): HTMLElement[] {
	const pages = containerRef.querySelectorAll("[data-page]");
	return Array.from(pages) as HTMLElement[];
}
