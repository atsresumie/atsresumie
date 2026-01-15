import { NextResponse } from "next/server";
import { mockAnalyze } from "@/lib/ats/mock";

export async function POST(req: Request) {
	const body = await req.json();
	const { mode, jobDescription, resumeText, focusPrompt } = body ?? {};

	if (!jobDescription || !resumeText) {
		return NextResponse.json({ error: "Missing inputs" }, { status: 400 });
	}

	const result = mockAnalyze({
		mode,
		jobDescription,
		resumeText,
		focusPrompt,
	});
	return NextResponse.json(result);
}
