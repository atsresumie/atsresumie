"use client";

import { useRef, useState, useCallback } from "react";
import { FileText, Upload, X, File } from "lucide-react";

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

function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

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
						<div
							onDragOver={handleDragOver}
							onDragLeave={handleDragLeave}
							onDrop={handleDrop}
							onClick={handleBrowseClick}
							className={`
								group relative flex h-44 w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed transition-all duration-200
								${
									isDragging
										? "border-[#E9DDC7] bg-[rgba(233,221,199,0.12)]"
										: "border-[rgba(233,221,199,0.2)] bg-[rgba(233,221,199,0.03)] hover:border-[rgba(233,221,199,0.35)] hover:bg-[rgba(233,221,199,0.06)]"
								}
							`}
						>
							<div
								className={`
								flex h-12 w-12 items-center justify-center rounded-full transition-all duration-200
								${
									isDragging
										? "bg-[rgba(233,221,199,0.2)]"
										: "bg-[rgba(233,221,199,0.08)] group-hover:bg-[rgba(233,221,199,0.12)]"
								}
							`}
							>
								<Upload
									className={`h-5 w-5 transition-all duration-200 ${
										isDragging
											? "text-[#E9DDC7]"
											: "text-[rgba(233,221,199,0.5)] group-hover:text-[rgba(233,221,199,0.7)]"
									}`}
								/>
							</div>
							<div className="text-center">
								<p
									className={`text-sm transition-colors ${
										isDragging
											? "text-[#E9DDC7]"
											: "text-[rgba(233,221,199,0.75)]"
									}`}
								>
									{isDragging
										? "Drop your resume here"
										: "Drag & drop your resume here"}
								</p>
								<p className="mt-1 text-xs text-[rgba(233,221,199,0.45)]">
									or{" "}
									<span className="text-[rgba(233,221,199,0.7)] underline underline-offset-2">
										browse files
									</span>
								</p>
							</div>
							<div className="flex items-center gap-2">
								<span className="rounded-md bg-[rgba(233,221,199,0.08)] px-2 py-0.5 text-xs text-[rgba(233,221,199,0.5)]">
									PDF
								</span>
								<span className="rounded-md bg-[rgba(233,221,199,0.08)] px-2 py-0.5 text-xs text-[rgba(233,221,199,0.5)]">
									DOCX
								</span>
								<span className="text-xs text-[rgba(233,221,199,0.35)]">
									• Max 10MB
								</span>
							</div>
						</div>
					) : (
						<div className="flex h-20 w-full items-center justify-between rounded-xl border border-[rgba(233,221,199,0.15)] bg-[rgba(233,221,199,0.05)] px-4">
							<div className="flex items-center gap-3">
								<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[rgba(233,221,199,0.1)]">
									<File className="h-5 w-5 text-[rgba(233,221,199,0.7)]" />
								</div>
								<div>
									<p className="text-sm font-medium text-[#E9DDC7] truncate max-w-[200px]">
										{resumeFile.name}
									</p>
									<p className="text-xs text-[rgba(233,221,199,0.5)]">
										{formatFileSize(resumeFile.size)}
									</p>
								</div>
							</div>
							<button
								onClick={handleRemoveFile}
								className="flex h-8 w-8 items-center justify-center rounded-lg text-[rgba(233,221,199,0.5)] transition-colors hover:bg-[rgba(233,221,199,0.1)] hover:text-[#E9DDC7]"
								type="button"
							>
								<X className="h-4 w-4" />
							</button>
						</div>
					)}

					<div className="mt-1 text-xs text-[rgba(233,221,199,0.55)]">
						We'll extract text from your resume for analysis.
					</div>
				</div>

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

			<div className="flex flex-col gap-3 pt-2 sm:flex-row">
				<button
					onClick={onBack}
					className="inline-flex w-full items-center justify-center rounded-xl border border-[rgba(233,221,199,0.15)] bg-[rgba(233,221,199,0.06)] px-4 py-3 text-sm hover:bg-[rgba(233,221,199,0.10)] sm:w-1/2"
				>
					Back
				</button>
				<button
					disabled={!canAnalyze}
					onClick={onAnalyze}
					className="inline-flex w-full items-center justify-center rounded-xl bg-[#E9DDC7] px-4 py-3 text-sm font-medium text-[#2a1e18] shadow-[0_10px_30px_rgba(233,221,199,0.12)] hover:-translate-y-px hover:shadow-[0_16px_40px_rgba(233,221,199,0.16)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 sm:w-1/2"
				>
					{isAnalyzing ? "Analyzing…" : "Analyze & Preview"}
				</button>
			</div>

			<p className="text-xs text-[rgba(233,221,199,0.55)]">
				Preview is free. Export to PDF uses credits after signup.
			</p>
		</section>
	);
}
