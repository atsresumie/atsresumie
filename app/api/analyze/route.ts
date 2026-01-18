import { NextResponse } from "next/server";
import { mockAnalyze } from "@/lib/ats/mock";
import { extractTextFromFile } from "@/lib/ats/extractText";

export async function POST(req: Request) {
	try {
		const formData = await req.formData();
		
		const mode = formData.get("mode") as "QUICK" | "DEEP" | "FROM_SCRATCH";
		const jobDescription = formData.get("jobDescription") as string;
		const focusPrompt = formData.get("focusPrompt") as string;
		const resumeFile = formData.get("resumeFile") as File | null;

		
		if (!jobDescription || !resumeFile) {
			return NextResponse.json({ error: "Missing inputs" }, { status: 400 });
		}

		// Extract text from the resume file (supports PDF, DOCX, and plain text)
		const resumeText = await extractTextFromFile(resumeFile);
		
		const result = mockAnalyze({
			mode,
			jobDescription,
			resumeText,
			focusPrompt,
		});
		return NextResponse.json(result);
	} catch (error) {
		console.error("Analyze API error:", error);
		return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
	}
}

export async function GET(req: Request) {
	return NextResponse.json({ status: "ok" });
}
