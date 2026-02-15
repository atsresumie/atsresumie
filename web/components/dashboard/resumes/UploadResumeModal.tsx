"use client";

import { useState, useRef } from "react";
import { Loader2, Upload, FileText, X } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ACCEPTED_FILE_TYPES = [
	"application/pdf",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	"application/msword",
	"text/plain",
];

const ACCEPTED_EXTENSIONS = [".pdf", ".docx", ".doc", ".txt"];

interface UploadResumeModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onUpload: (file: File, label?: string) => Promise<unknown>;
}

export function UploadResumeModal({
	open,
	onOpenChange,
	onUpload,
}: UploadResumeModalProps) {
	const [file, setFile] = useState<File | null>(null);
	const [label, setLabel] = useState("");
	const [isUploading, setIsUploading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const selectedFile = e.target.files?.[0];
		if (!selectedFile) return;

		// Validate file type
		const isValidType = ACCEPTED_FILE_TYPES.includes(selectedFile.type);
		const isValidExt = ACCEPTED_EXTENSIONS.some((ext) =>
			selectedFile.name.toLowerCase().endsWith(ext),
		);

		if (!isValidType && !isValidExt) {
			setError("Please select a PDF, DOCX, DOC, or TXT file");
			return;
		}

		// Validate file size (10MB max)
		if (selectedFile.size > 10 * 1024 * 1024) {
			setError("File size must be less than 10MB");
			return;
		}

		setFile(selectedFile);
		setError(null);
	};

	const handleRemoveFile = () => {
		setFile(null);
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!file) {
			setError("Please select a file");
			return;
		}

		setIsUploading(true);
		setError(null);

		try {
			await onUpload(file, label.trim() || undefined);
			// Reset and close
			setFile(null);
			setLabel("");
			onOpenChange(false);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to upload resume",
			);
		} finally {
			setIsUploading(false);
		}
	};

	const handleClose = () => {
		if (!isUploading) {
			setFile(null);
			setLabel("");
			setError(null);
			onOpenChange(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Upload Resume</DialogTitle>
					<DialogDescription>
						Upload a PDF, DOCX, or TXT file. Text will be extracted
						automatically.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4">
					{/* File picker area */}
					<div className="space-y-2">
						<Label>Resume File</Label>
						{!file ? (
							<div
								className="border-2 border-dashed border-border/50 rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
								onClick={() => fileInputRef.current?.click()}
							>
								<Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
								<p className="text-sm text-muted-foreground">
									Click to select or drag & drop
								</p>
								<p className="text-xs text-muted-foreground mt-1">
									PDF, DOCX, DOC, or TXT (max 10MB)
								</p>
							</div>
						) : (
							<div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
								<FileText className="h-8 w-8 text-primary" />
								<div className="flex-1 min-w-0">
									<p className="text-sm font-medium truncate">
										{file.name}
									</p>
									<p className="text-xs text-muted-foreground">
										{(file.size / 1024).toFixed(1)} KB
									</p>
								</div>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									onClick={handleRemoveFile}
									disabled={isUploading}
								>
									<X className="h-4 w-4" />
								</Button>
							</div>
						)}
						<input
							ref={fileInputRef}
							type="file"
							accept={ACCEPTED_EXTENSIONS.join(",")}
							onChange={handleFileSelect}
							className="hidden"
						/>
					</div>

					{/* Label input */}
					<div className="space-y-2">
						<Label htmlFor="label">Label (optional)</Label>
						<Input
							id="label"
							placeholder="e.g., Software Engineer Resume"
							value={label}
							onChange={(e) => setLabel(e.target.value)}
							disabled={isUploading}
						/>
						<p className="text-xs text-muted-foreground">
							Leave empty to auto-generate a label
						</p>
					</div>

					{/* Error message */}
					{error && <p className="text-sm text-red-500">{error}</p>}

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={handleClose}
							disabled={isUploading}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={!file || isUploading}>
							{isUploading ? (
								<>
									<Loader2
										size={16}
										className="mr-2 animate-spin"
									/>
									Uploading...
								</>
							) : (
								"Upload"
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
