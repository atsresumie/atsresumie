"use client";

import { useState, useCallback } from "react";
import { useDropzone, FileRejection } from "react-dropzone";
import { Upload, X, FileText, Loader2, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useResumeVersions } from "@/hooks/useResumeVersions";

interface QuickUploadModalProps {
	open: boolean;
	onClose: () => void;
	onUploadSuccess?: (resumeId: string) => void;
}

const ACCEPTED_TYPES = {
	"application/pdf": [".pdf"],
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
		".docx",
	],
};

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Quick upload modal for the generate page.
 * Allows uploading a resume without navigating away.
 */
export function QuickUploadModal({
	open,
	onClose,
	onUploadSuccess,
}: QuickUploadModalProps) {
	const { uploadResume } = useResumeVersions();
	const [file, setFile] = useState<File | null>(null);
	const [label, setLabel] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [isUploading, setIsUploading] = useState(false);
	const [uploadComplete, setUploadComplete] = useState(false);

	const onDrop = useCallback(
		(acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
			setError(null);

			if (rejectedFiles.length > 0) {
				const rejection = rejectedFiles[0];
				if (rejection.errors?.[0]?.code === "file-too-large") {
					setError("File is too large. Maximum size is 5MB.");
				} else if (
					rejection.errors?.[0]?.code === "file-invalid-type"
				) {
					setError("Invalid file type. Please upload a PDF or DOCX.");
				} else {
					setError("Invalid file.");
				}
				return;
			}

			if (acceptedFiles.length > 0) {
				setFile(acceptedFiles[0]);
				// Auto-generate label from filename
				const name = acceptedFiles[0].name.replace(/\.[^/.]+$/, "");
				setLabel(name.slice(0, 50));
			}
		},
		[],
	);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		accept: ACCEPTED_TYPES,
		maxSize: MAX_SIZE,
		multiple: false,
		disabled: isUploading,
	});

	const handleUpload = async () => {
		if (!file) return;

		setIsUploading(true);
		setError(null);

		try {
			const result = await uploadResume(file, label.trim() || undefined);

			if (result) {
				setUploadComplete(true);
				setTimeout(() => {
					onUploadSuccess?.(result.id);
					handleClose();
				}, 1000);
			} else {
				setError("Failed to upload resume. Please try again.");
			}
		} catch (err) {
			console.error("Upload error:", err);
			setError(err instanceof Error ? err.message : "Upload failed");
		} finally {
			setIsUploading(false);
		}
	};

	const handleClose = () => {
		if (!isUploading) {
			setFile(null);
			setLabel("");
			setError(null);
			setUploadComplete(false);
			onClose();
		}
	};

	const removeFile = () => {
		setFile(null);
		setLabel("");
		setError(null);
	};

	return (
		<Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Upload Resume</DialogTitle>
				</DialogHeader>

				<div className="space-y-4 py-4">
					{/* Dropzone or File Preview */}
					{!file ? (
						<div
							{...getRootProps()}
							className={`
								relative rounded-lg border-2 border-dashed p-8 text-center
								transition-colors cursor-pointer
								${
									isDragActive
										? "border-primary bg-primary/5"
										: "border-border hover:border-primary/50"
								}
							`}
						>
							<input {...getInputProps()} />
							<Upload className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
							<p className="text-sm font-medium">
								{isDragActive
									? "Drop your resume here"
									: "Drag & drop or click to upload"}
							</p>
							<p className="text-xs text-muted-foreground mt-1">
								PDF or DOCX, max 5MB
							</p>
						</div>
					) : (
						<div className="rounded-lg border border-border p-4">
							<div className="flex items-center gap-3">
								<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
									{uploadComplete ? (
										<Check className="h-5 w-5 text-emerald-400" />
									) : (
										<FileText className="h-5 w-5 text-primary" />
									)}
								</div>
								<div className="flex-1 min-w-0">
									<p className="font-medium text-sm truncate">
										{file.name}
									</p>
									<p className="text-xs text-muted-foreground">
										{(file.size / 1024).toFixed(1)} KB
									</p>
								</div>
								{!isUploading && !uploadComplete && (
									<button
										onClick={removeFile}
										className="p-1 rounded hover:bg-muted"
									>
										<X className="h-4 w-4 text-muted-foreground" />
									</button>
								)}
							</div>
						</div>
					)}

					{/* Label Input */}
					{file && !uploadComplete && (
						<div>
							<label className="text-sm font-medium mb-1.5 block">
								Resume Label (optional)
							</label>
							<Input
								value={label}
								onChange={(e) => setLabel(e.target.value)}
								placeholder="e.g. Software Engineer Resume"
								disabled={isUploading}
								maxLength={50}
							/>
						</div>
					)}

					{/* Error Message */}
					{error && (
						<div className="flex items-center gap-2 text-sm text-red-400 bg-red-400/10 rounded-lg p-3">
							<AlertCircle className="h-4 w-4 flex-shrink-0" />
							{error}
						</div>
					)}

					{/* Success Message */}
					{uploadComplete && (
						<div className="flex items-center gap-2 text-sm text-emerald-400 bg-emerald-400/10 rounded-lg p-3">
							<Check className="h-4 w-4 flex-shrink-0" />
							Resume uploaded successfully!
						</div>
					)}
				</div>

				{/* Actions */}
				<div className="flex gap-3 justify-end">
					<Button
						variant="outline"
						onClick={handleClose}
						disabled={isUploading}
					>
						Cancel
					</Button>
					<Button
						onClick={handleUpload}
						disabled={!file || isUploading || uploadComplete}
					>
						{isUploading ? (
							<>
								<Loader2 className="h-4 w-4 animate-spin mr-2" />
								Uploading...
							</>
						) : uploadComplete ? (
							<>
								<Check className="h-4 w-4 mr-2" />
								Done
							</>
						) : (
							"Upload"
						)}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
