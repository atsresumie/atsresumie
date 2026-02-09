"use client";

import type { EditorPageSize } from "./types";

interface CapturedImage {
	jpegBytes: Uint8Array;
	width: number;
	height: number;
}

interface ExportPdfOptions {
	pageElements: HTMLElement[];
	fileName: string;
	pageSize: EditorPageSize;
}

const PDF_PAGE_SIZE_POINTS: Record<EditorPageSize, { width: number; height: number }> = {
	letter: { width: 612, height: 792 },
	a4: { width: 595.28, height: 841.89 },
};

function normalizeFileName(fileName: string): string {
	const cleaned =
		fileName
			.trim()
			.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_") || "ATSResumie_Resume";

	return cleaned.toLowerCase().endsWith(".pdf") ? cleaned : `${cleaned}.pdf`;
}

function dataUrlToJpegBytes(dataUrl: string): Uint8Array {
	const base64 = dataUrl.split(",")[1] || "";
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let index = 0; index < binary.length; index += 1) {
		bytes[index] = binary.charCodeAt(index);
	}
	return bytes;
}

function cloneNodeWithStyles(node: Node): Node {
	if (node.nodeType === Node.TEXT_NODE) {
		return node.cloneNode(true);
	}

	if (!(node instanceof Element)) {
		return node.cloneNode(false);
	}

	const clone = node.cloneNode(false) as Element;
	const computed = window.getComputedStyle(node);
	if ("style" in clone) {
		const styleTarget = clone as HTMLElement | SVGElement;
		for (const property of Array.from(computed)) {
			styleTarget.style.setProperty(
				property,
				computed.getPropertyValue(property),
				computed.getPropertyPriority(property),
			);
		}
	}

	if (node instanceof HTMLInputElement) {
		clone.setAttribute("value", node.value);
	}
	if (node instanceof HTMLTextAreaElement) {
		clone.textContent = node.value;
	}

	for (const child of Array.from(node.childNodes)) {
		clone.appendChild(cloneNodeWithStyles(child));
	}

	return clone;
}

function loadImage(url: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const image = new Image();
		image.onload = () => resolve(image);
		image.onerror = () => reject(new Error("Failed to load page image"));
		image.src = url;
	});
}

async function capturePageNode(pageElement: HTMLElement): Promise<CapturedImage> {
	const rect = pageElement.getBoundingClientRect();
	const width = Math.max(1, Math.round(rect.width));
	const height = Math.max(1, Math.round(rect.height));

	const clone = cloneNodeWithStyles(pageElement) as HTMLElement;
	clone.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
	clone.style.margin = "0";

	const serializedClone = new XMLSerializer().serializeToString(clone);
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><foreignObject width="100%" height="100%">${serializedClone}</foreignObject></svg>`;
	const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
	const svgUrl = URL.createObjectURL(svgBlob);

	try {
		const image = await loadImage(svgUrl);
		const pixelRatio = Math.min(2.5, Math.max(1.75, window.devicePixelRatio || 1));
		const canvas = document.createElement("canvas");
		canvas.width = Math.round(width * pixelRatio);
		canvas.height = Math.round(height * pixelRatio);

		const context = canvas.getContext("2d");
		if (!context) {
			throw new Error("Canvas context is unavailable");
		}

		context.scale(pixelRatio, pixelRatio);
		context.fillStyle = "#f7f2e8";
		context.fillRect(0, 0, width, height);
		context.drawImage(image, 0, 0, width, height);

		const jpegDataUrl = canvas.toDataURL("image/jpeg", 0.96);
		return {
			jpegBytes: dataUrlToJpegBytes(jpegDataUrl),
			width,
			height,
		};
	} finally {
		URL.revokeObjectURL(svgUrl);
	}
}

function createPdfBinary(images: CapturedImage[], pageSize: EditorPageSize): Uint8Array {
	const encoder = new TextEncoder();
	const parts: Uint8Array[] = [];
	let offset = 0;
	const pagePoints = PDF_PAGE_SIZE_POINTS[pageSize];

	const pushBytes = (bytes: Uint8Array) => {
		parts.push(bytes);
		offset += bytes.length;
	};

	const pushText = (text: string) => {
		pushBytes(encoder.encode(text));
	};

	const objectOffsets: number[] = [];
	const totalObjects = 2 + images.length * 3;

	const writeObject = (objectId: number, writer: () => void) => {
		objectOffsets[objectId] = offset;
		pushText(`${objectId} 0 obj\n`);
		writer();
		pushText("\nendobj\n");
	};

	pushText("%PDF-1.4\n%\u00FF\u00FF\u00FF\u00FF\n");

	const pageObjectIds = images.map((_, index) => 3 + index * 3);
	const contentObjectIds = images.map((_, index) => 4 + index * 3);
	const imageObjectIds = images.map((_, index) => 5 + index * 3);

	writeObject(1, () => {
		pushText("<< /Type /Catalog /Pages 2 0 R >>");
	});

	writeObject(2, () => {
		pushText(
			`<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${images.length} >>`,
		);
	});

	images.forEach((image, index) => {
		const pageObjectId = pageObjectIds[index];
		const contentObjectId = contentObjectIds[index];
		const imageObjectId = imageObjectIds[index];
		const imageResourceName = `/Im${index + 1}`;

		writeObject(pageObjectId, () => {
			pushText(
				`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pagePoints.width} ${pagePoints.height}] /Resources << /XObject << ${imageResourceName} ${imageObjectId} 0 R >> >> /Contents ${contentObjectId} 0 R >>`,
			);
		});

		const contentStream = `q\n${pagePoints.width} 0 0 ${pagePoints.height} 0 0 cm\n${imageResourceName} Do\nQ\n`;
		writeObject(contentObjectId, () => {
			pushText(`<< /Length ${contentStream.length} >>\nstream\n`);
			pushText(contentStream);
			pushText("endstream");
		});

		writeObject(imageObjectId, () => {
			pushText(
				`<< /Type /XObject /Subtype /Image /Width ${image.width} /Height ${image.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.jpegBytes.length} >>\nstream\n`,
			);
			pushBytes(image.jpegBytes);
			pushText("\nendstream");
		});
	});

	const xrefOffset = offset;
	pushText(`xref\n0 ${totalObjects + 1}\n`);
	pushText("0000000000 65535 f \n");
	for (let objectId = 1; objectId <= totalObjects; objectId += 1) {
		const currentOffset = objectOffsets[objectId] || 0;
		pushText(`${String(currentOffset).padStart(10, "0")} 00000 n \n`);
	}

	pushText(
		`trailer\n<< /Size ${totalObjects + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`,
	);

	const merged = new Uint8Array(parts.reduce((size, part) => size + part.length, 0));
	let cursor = 0;
	for (const part of parts) {
		merged.set(part, cursor);
		cursor += part.length;
	}

	return merged;
}

export async function exportResumePagesToPdf({
	pageElements,
	fileName,
	pageSize,
}: ExportPdfOptions): Promise<void> {
	if (pageElements.length === 0) {
		throw new Error("No pages available for export");
	}

	if ("fonts" in document) {
		await (document as Document & { fonts: FontFaceSet }).fonts.ready;
	}

	const captures: CapturedImage[] = [];
	for (const pageElement of pageElements) {
		captures.push(await capturePageNode(pageElement));
	}

	const pdfBytes = createPdfBinary(captures, pageSize);
	const arrayBuffer = new ArrayBuffer(pdfBytes.byteLength);
	new Uint8Array(arrayBuffer).set(pdfBytes);
	const blob = new Blob([arrayBuffer], { type: "application/pdf" });
	const blobUrl = URL.createObjectURL(blob);

	try {
		const anchor = document.createElement("a");
		anchor.href = blobUrl;
		anchor.download = normalizeFileName(fileName);
		anchor.rel = "noopener";
		anchor.style.display = "none";
		document.body.appendChild(anchor);
		anchor.click();
		document.body.removeChild(anchor);
	} finally {
		URL.revokeObjectURL(blobUrl);
	}
}
