"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface FeedbackModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
	const [message, setMessage] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const modalRef = useRef<HTMLDivElement>(null);
	const { user } = useAuth();

	// Focus textarea when modal opens
	useEffect(() => {
		if (isOpen && textareaRef.current) {
			textareaRef.current.focus();
		}
	}, [isOpen]);

	// Handle ESC key
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape" && isOpen) {
				onClose();
			}
		};
		document.addEventListener("keydown", handleKeyDown);
		return () => document.removeEventListener("keydown", handleKeyDown);
	}, [isOpen, onClose]);

	// Handle click outside
	const handleBackdropClick = (e: React.MouseEvent) => {
		if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
			onClose();
		}
	};

	const handleSubmit = async () => {
		if (!message.trim() || isSubmitting) return;

		setIsSubmitting(true);
		try {
			const response = await fetch("/api/feedback", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ message: message.trim() }),
			});

			if (!response.ok) {
				throw new Error("Failed to submit feedback");
			}

			toast.success("Thank you for your feedback!");
			setMessage("");
			onClose();
		} catch (error) {
			toast.error("Failed to submit feedback. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	if (!isOpen) return null;

	return (
		<div
			className="fixed inset-0 z-[100] flex items-start justify-center pt-24"
			onClick={handleBackdropClick}
		>
			{/* Backdrop */}
			<div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

			{/* Modal */}
			<div
				ref={modalRef}
				className="relative w-full max-w-md mx-4 bg-card/95 backdrop-blur-md border border-border/50 rounded-xl shadow-2xl animate-in fade-in zoom-in-95 duration-200"
			>
				{/* Header */}
				<div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
					<div className="flex items-center gap-2">
						<MessageSquare
							size={18}
							className="text-muted-foreground"
						/>
						<h2 className="text-lg font-semibold text-foreground">
							Feedback
						</h2>
					</div>
					<button
						onClick={onClose}
						className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
						aria-label="Close"
					>
						<X size={18} />
					</button>
				</div>

				{/* Body */}
				<div className="p-5">
					<textarea
						ref={textareaRef}
						value={message}
						onChange={(e) => setMessage(e.target.value)}
						placeholder="My idea for improving ATSResumie is…"
						className="w-full h-32 px-4 py-3 bg-muted/30 border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
					/>
				</div>

				{/* Footer */}
				<div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-border/50">
					<button
						onClick={onClose}
						className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
					>
						Cancel
					</button>
					<button
						onClick={handleSubmit}
						disabled={!message.trim() || isSubmitting}
						className="px-4 py-2 text-sm font-medium bg-secondary text-secondary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
					>
						{isSubmitting ? (
							<>
								<Loader2 size={14} className="animate-spin" />
								Sending...
							</>
						) : (
							<>
								<Send size={14} />
								Send
							</>
						)}
					</button>
				</div>
			</div>
		</div>
	);
}

// Feedback button component for header
export function FeedbackButton() {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<>
			<button
				onClick={() => setIsOpen(true)}
				className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground bg-muted/30 hover:bg-muted/50 border border-border/50 rounded-lg transition-colors"
			>
				<MessageSquare size={14} />
				Feedback
			</button>
			<FeedbackModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
		</>
	);
}
