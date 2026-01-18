"use client";

import { useRef, useState, useCallback } from "react";
import { FileText } from "lucide-react";
import { FileDropzone, FilePreview, ActionButtons } from "./components";

interface Step1InputFormProps {
	jobDescription: string;
	onJobDescriptionChange: (value: string) => void;
	resumeFile: File | null;
	onResumeFileChange: (file: File | null) => void;
	focusPrompt: string;
	onFocusPromptChange: (value: string) => void;
	canAnalyze: boolean;
	isAnalyzing: boolean;
	onBack: () => void;
	onAnalyze: () => void;
}

const ACCEPTED_TYPES = [
	"application/pdf",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const ACCEPTED_EXTENSIONS = [".pdf", ".docx"];

export default function Step1InputForm({
	jobDescription,
	onJobDescriptionChange,
	resumeFile,
	onResumeFileChange,
	focusPrompt,
	onFocusPromptChange,
	canAnalyze,
	isAnalyzing,
	onBack,
	onAnalyze,
}: Step1InputFormProps) {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [isDragging, setIsDragging] = useState(false);

	const validateAndSetFile = useCallback(
		(file: File | null) => {
			if (!file) {
				onResumeFileChange(null);
				return;
			}

			// Validate file type
			const isValidType = ACCEPTED_TYPES.includes(file.type);
			const hasValidExtension = ACCEPTED_EXTENSIONS.some((ext) =>
				file.name.toLowerCase().endsWith(ext)
			);

			if (!isValidType && !hasValidExtension) {
				alert("Please upload a PDF or DOCX file only.");
				return;
			}

			// Validate file size (max 10MB)
			if (file.size > 10 * 1024 * 1024) {
				alert("File size must be less than 10MB.");
				return;
			}

			onResumeFileChange(file);
		},
		[onResumeFileChange]
	);

	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(true);
	}, []);

	const handleDragLeave = useCallback((e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragging(false);
	}, []);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			e.stopPropagation();
			setIsDragging(false);

			const files = e.dataTransfer.files;
			if (files.length > 0) {
				validateAndSetFile(files[0]);
			}
		},
		[validateAndSetFile]
	);

	const handleFileSelect = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const files = e.target.files;
			if (files && files.length > 0) {
				validateAndSetFile(files[0]);
			}
		},
		[validateAndSetFile]
	);

	const handleBrowseClick = useCallback(() => {
		fileInputRef.current?.click();
	}, []);

	const handleRemoveFile = useCallback(() => {
		onResumeFileChange(null);
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	}, [onResumeFileChange]);

	return (
		<section className="space-y-4">
			<div className="flex items-center gap-2 text-sm text-[rgba(233,221,199,0.75)]">
				<FileText className="h-4 w-4" />
				Paste the essentials
			</div>

			<div className="space-y-3">
				{/* Job Description Input */}
				<label className="block">
					<div className="mb-1 text-sm">Job Description</div>
					<textarea
						value={jobDescription}
						onChange={(e) => onJobDescriptionChange(e.target.value)}
						placeholder="Paste the full job posting…"
						className="h-44 w-full resize-none rounded-xl border border-[rgba(233,221,199,0.12)] bg-[rgba(233,221,199,0.05)] p-3 text-sm outline-none placeholder:text-[rgba(233,221,199,0.35)] focus:border-[rgba(233,221,199,0.22)]"
					/>
					<div className="mt-1 text-xs text-[rgba(233,221,199,0.55)]">
						Tip: include responsibilities + requirements +
						nice-to-have keywords.
					</div>
				</label>

				{/* File Upload Area */}
				<div className="block">
					<div className="mb-1 text-sm">Upload Resume</div>
					<input
						ref={fileInputRef}
						type="file"
						accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
						onChange={handleFileSelect}
						className="hidden"
					/>

					{!resumeFile ? (
						<FileDropzone
							isDragging={isDragging}
							onDragOver={handleDragOver}
							onDragLeave={handleDragLeave}
							onDrop={handleDrop}
							onClick={handleBrowseClick}
						/>
					) : (
						<FilePreview
							file={resumeFile}
							onRemove={handleRemoveFile}
						/>
					)}

					<div className="mt-1 text-xs text-[rgba(233,221,199,0.55)]">
						We'll extract text from your resume for analysis.
					</div>
				</div>

				{/* Focus Input */}
				<label className="block">
					<div className="mb-1 text-sm">Focus (optional)</div>
					<input
						value={focusPrompt}
						onChange={(e) => onFocusPromptChange(e.target.value)}
						placeholder="e.g., Emphasize Node.js, scalability, and impact metrics. Keep 1 page."
						className="w-full rounded-xl border border-[rgba(233,221,199,0.12)] bg-[rgba(233,221,199,0.05)] p-3 text-sm outline-none placeholder:text-[rgba(233,221,199,0.35)] focus:border-[rgba(233,221,199,0.22)]"
					/>
				</label>
			</div>

			<ActionButtons
				canAnalyze={canAnalyze}
				isAnalyzing={isAnalyzing}
				onBack={onBack}
				onAnalyze={onAnalyze}
			/>

			<p className="text-xs text-[rgba(233,221,199,0.55)]">
				Preview is free. Export to PDF uses credits after signup.
			</p>
		</section>
	);
}
