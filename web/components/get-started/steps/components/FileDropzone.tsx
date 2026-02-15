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
	);
}
