"use client";

import { Upload } from "lucide-react";

interface FileDropzoneProps {
	isDragging: boolean;
	onDragOver: (e: React.DragEvent) => void;
	onDragLeave: (e: React.DragEvent) => void;
	onDrop: (e: React.DragEvent) => void;
	onClick: () => void;
}

export default function FileDropzone({
	isDragging,
	onDragOver,
	onDragLeave,
	onDrop,
	onClick,
}: FileDropzoneProps) {
	return (
		<div
			onDragOver={onDragOver}
			onDragLeave={onDragLeave}
			onDrop={onDrop}
			onClick={onClick}
			className={`
				group relative flex h-44 w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed transition-all duration-200
				${
					isDragging
						? "border-text-primary bg-surface-inset"
						: "border-border-visible bg-surface-base hover:border-text-secondary hover:bg-surface-inset"
				}
			`}
		>
			<div
				className={`
				flex h-12 w-12 items-center justify-center rounded-full transition-all duration-200
				${
					isDragging
						? "bg-surface-inset"
						: "bg-surface-raised group-hover:bg-surface-inset"
				}
			`}
			>
				<Upload
					className={`h-5 w-5 transition-all duration-200 ${
						isDragging
							? "text-text-primary"
							: "text-text-tertiary group-hover:text-text-secondary"
					}`}
				/>
			</div>
			<div className="text-center">
				<p
					className={`text-sm transition-colors ${
						isDragging
							? "text-text-primary"
							: "text-text-secondary"
					}`}
				>
					{isDragging
						? "Drop your resume here"
						: "Drag & drop your resume here"}
				</p>
				<p className="mt-1 text-xs text-text-tertiary">
					or{" "}
					<span className="text-text-secondary underline underline-offset-2">
						browse files
					</span>
				</p>
			</div>
			<div className="flex items-center gap-2">
				<span className="rounded-md bg-surface-raised px-2 py-0.5 text-xs text-text-tertiary">
					PDF
				</span>
				<span className="rounded-md bg-surface-raised px-2 py-0.5 text-xs text-text-tertiary">
					DOCX
				</span>
				<span className="text-xs text-text-tertiary">
					• Max 10MB
				</span>
			</div>
		</div>
	);
}
