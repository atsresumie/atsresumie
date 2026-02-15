import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { extractTextFromFile } from "@/lib/ats/extractText";

/**
 * POST /api/resumes/extract-text
 * Extract text from a resume file stored in Supabase Storage.
 */
export async function POST(request: Request) {
	try {
		const { objectPath } = await request.json();

		if (!objectPath || typeof objectPath !== "string") {
			return NextResponse.json(
				{ error: "objectPath is required" },
				{ status: 400 },
			);
		}

		// Create authenticated Supabase client
		const cookieStore = await cookies();
		const supabase = createServerClient(
			process.env.NEXT_PUBLIC_SUPABASE_URL!,
			process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
			{
				cookies: {
					getAll() {
						return cookieStore.getAll();
					},
					setAll(cookiesToSet) {
						cookiesToSet.forEach(({ name, value, options }) => {
							cookieStore.set(name, value, options);
						});
					},
				},
			},
		);

		// Verify user is authenticated
		const {
			data: { user },
			error: authError,
		} = await supabase.auth.getUser();

		if (authError || !user) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 },
			);
		}

		// Verify the file belongs to the user (path should contain user ID)
		if (!objectPath.includes(user.id)) {
			return NextResponse.json(
				{ error: "Access denied" },
				{ status: 403 },
			);
		}

		// Download the file from storage
		const { data: fileData, error: downloadError } = await supabase.storage
			.from("resumes")
			.download(objectPath);

		if (downloadError || !fileData) {
			console.error("Failed to download file:", downloadError);
			return NextResponse.json(
				{ error: "Failed to download file" },
				{ status: 500 },
			);
		}

		// Convert Blob to File for extraction
		const fileName = objectPath.split("/").pop() || "resume";
		const file = new File([fileData], fileName, { type: fileData.type });

		// Extract text
		const text = await extractTextFromFile(file);

		return NextResponse.json({ text });
	} catch (error) {
		console.error("Extract text error:", error);
		return NextResponse.json(
			{ error: "Failed to extract text" },
			{ status: 500 },
		);
	}
}
