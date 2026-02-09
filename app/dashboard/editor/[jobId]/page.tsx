"use client";

import { useParams } from "next/navigation";
import { ResumeEditorShell } from "@/components/editor/ResumeEditorShell";
import { ErrorState } from "@/components/shared/ErrorState";

export default function ResumeEditorPage() {
	const params = useParams<{ jobId: string }>();
	const jobId = params.jobId;

	if (!jobId) {
		return (
			<ErrorState
				title="Invalid generation"
				message="Missing generation identifier for editor route."
			/>
		);
	}

	return <ResumeEditorShell jobId={jobId} />;
}
