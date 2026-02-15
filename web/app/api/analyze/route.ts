import { NextResponse } from "next/server";
import { mockAnalyze } from "@/lib/ats/mock";
import { extractTextFromFile } from "@/lib/ats/extractText";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: Request) {
	try {
		const formData = await req.formData();
		
		const mode = formData.get("mode") as "QUICK" | "DEEP" | "FROM_SCRATCH";
		const jobDescription = formData.get("jobDescription") as string;
		const focusPrompt = formData.get("focusPrompt") as string;
		const resumeFile = formData.get("resumeFile") as File | null;
		
		// Support for fetching stored resume from Supabase Storage
		const resumeBucket = formData.get("resumeBucket") as string | null;
		const resumeObjectPath = formData.get("resumeObjectPath") as string | null;

		if (!jobDescription) {
			return NextResponse.json({ error: "Missing job description" }, { status: 400 });
		}

		let resumeText: string;

		if (resumeFile) {
			// Extract text from uploaded file
			resumeText = await extractTextFromFile(resumeFile);
		} else if (resumeBucket && resumeObjectPath) {
			// Fetch from Supabase Storage
			const supabase = supabaseAdmin();
			const { data, error } = await supabase.storage
				.from(resumeBucket)
				.download(resumeObjectPath);

			if (error || !data) {
				console.error("Failed to download stored resume:", error);
				return NextResponse.json({ error: "Failed to fetch stored resume" }, { status: 500 });
			}

			// Convert blob to File for extraction
			const storedFile = new File([data], resumeObjectPath.split("/").pop() || "resume", {
				type: data.type,
			});
			resumeText = await extractTextFromFile(storedFile);
		} else {
			return NextResponse.json({ error: "Missing resume (upload file or provide storage path)" }, { status: 400 });
		}
		
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

