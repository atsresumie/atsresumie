import { NextResponse } from "next/server";

export async function POST(req: Request) {
	const body = await req.json();
	const { versionId } = body ?? {};
	if (!versionId)
		return NextResponse.json(
			{ error: "Missing versionId" },
			{ status: 400 }
		);

	// In your real system:
	// 1) retrieve stored LaTeX for versionId
	// 2) compile to PDF
	// 3) upload to storage and return a signed URL

	const latex = `% Full LaTeX would be stored per versionId: ${versionId}
\\documentclass[11pt]{article}
\\begin{document}
Hello from atsresumie export!
\\end{document}
`;

	return NextResponse.json({
		pdfUrl: "https://example.com/mock.pdf",
		latex,
	});
}
