import { extractText } from "unpdf";
import mammoth from "mammoth";

/**
 * Extracts text content from a resume file (PDF, DOCX, or plain text)
 */
export async function extractTextFromFile(file: File): Promise<string> {
	const fileType = file.type;
	const fileName = file.name.toLowerCase();

	// PDF files
	if (fileType === "application/pdf" || fileName.endsWith(".pdf")) {
		const arrayBuffer = await file.arrayBuffer();
		const { text } = await extractText(arrayBuffer);
		return text.join("\n");
	}

	// DOCX files
	if (
		fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
		fileName.endsWith(".docx")
	) {
		const buffer = Buffer.from(await file.arrayBuffer());
		const result = await mammoth.extractRawText({ buffer });
		return result.value;
	}

	// DOC files (older Word format) - mammoth can handle some of these
	if (
		fileType === "application/msword" ||
		fileName.endsWith(".doc")
	) {
		const buffer = Buffer.from(await file.arrayBuffer());
		const result = await mammoth.extractRawText({ buffer });
		return result.value;
	}

	// Plain text files (txt, etc.)
	return await file.text();
}
