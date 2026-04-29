"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, RotateCcw, Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types/chat";

interface ChatPanelProps {
	messages: ChatMessage[];
	isSending: boolean;
	onSend: (message: string) => void;
	onClear: () => void;
}

const SUGGESTIONS = [
	"Shorten my summary to two sentences.",
	"Make my most recent role's bullets more results-oriented.",
	"Reorder my skills to put cloud tools first.",
];

export function ChatPanel({
	messages,
	isSending,
	onSend,
	onClear,
}: ChatPanelProps) {
	const [draft, setDraft] = useState("");
	const scrollRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const el = scrollRef.current;
		if (el) el.scrollTop = el.scrollHeight;
	}, [messages]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const value = draft.trim();
		if (!value || isSending) return;
		onSend(value);
		setDraft("");
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSubmit(e);
		}
	};

	return (
		<div className="flex h-full flex-col">
			{/* Header */}
			<div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
				<h2 className="text-sm font-semibold uppercase tracking-wide text-text-secondary">
					Chat Edit
				</h2>
				{messages.length > 0 && (
					<Button
						variant="ghost"
						size="sm"
						onClick={onClear}
						disabled={isSending}
						className="h-7 gap-1.5 px-2 text-xs text-text-tertiary hover:text-text-primary"
					>
						<RotateCcw className="h-3 w-3" />
						Clear
					</Button>
				)}
			</div>

			{/* Messages */}
			<div
				ref={scrollRef}
				className="flex-1 space-y-3 overflow-y-auto px-3 py-3"
			>
				{messages.length === 0 ? (
					<EmptyState
						onPick={(s) => setDraft(s)}
						disabled={isSending}
					/>
				) : (
					messages.map((m) => <Bubble key={m.id} message={m} />)
				)}
			</div>

			{/* Composer */}
			<form
				onSubmit={handleSubmit}
				className="border-t border-border-subtle bg-surface-base/60 p-3"
			>
				<Textarea
					value={draft}
					onChange={(e) => setDraft(e.target.value)}
					onKeyDown={handleKeyDown}
					placeholder="Describe an edit (e.g., shorten summary)…"
					rows={3}
					disabled={isSending}
					className="resize-none text-sm"
				/>
				<div className="mt-2 flex items-center justify-between">
					<span className="text-[11px] text-text-tertiary">
						Enter to send · Shift+Enter for newline
					</span>
					<Button
						type="submit"
						size="sm"
						disabled={isSending || draft.trim().length < 2}
						className="gap-1.5"
					>
						{isSending ? (
							<Loader2 className="h-3.5 w-3.5 animate-spin" />
						) : (
							<Send className="h-3.5 w-3.5" />
						)}
						Send
					</Button>
				</div>
			</form>
		</div>
	);
}

function EmptyState({
	onPick,
	disabled,
}: {
	onPick: (s: string) => void;
	disabled: boolean;
}) {
	return (
		<div className="flex h-full flex-col items-start gap-3 px-1 py-2 text-sm text-text-secondary">
			<div className="flex items-center gap-2 text-text-primary">
				<Sparkles className="h-4 w-4" />
				<span className="font-medium">Edit with AI</span>
			</div>
			<p className="text-xs leading-relaxed text-text-tertiary">
				Describe a change in plain English. We&apos;ll update the LaTeX,
				recompile, and refresh the preview.
			</p>
			<div className="mt-1 w-full space-y-1.5">
				<p className="text-[11px] uppercase tracking-wider text-text-tertiary">
					Try
				</p>
				{SUGGESTIONS.map((s) => (
					<button
						key={s}
						type="button"
						disabled={disabled}
						onClick={() => onPick(s)}
						className="w-full rounded-md border border-border-subtle bg-surface-raised px-2.5 py-2 text-left text-xs text-text-secondary transition hover:border-border-visible hover:text-text-primary disabled:opacity-50"
					>
						{s}
					</button>
				))}
			</div>
		</div>
	);
}

function Bubble({ message }: { message: ChatMessage }) {
	const isUser = message.role === "user";
	const isApplying = message.status === "applying";
	const isError = message.status === "error";

	return (
		<div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
			<div
				className={cn(
					"max-w-[88%] rounded-lg px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap",
					isUser
						? "bg-cta/15 text-text-primary"
						: "bg-surface-raised text-text-secondary",
					isError && "border border-red-500/40 text-red-400",
				)}
			>
				{isApplying ? (
					<span className="flex items-center gap-2 text-text-tertiary">
						<Loader2 className="h-3.5 w-3.5 animate-spin" />
						{message.content}
					</span>
				) : (
					message.content
				)}
			</div>
		</div>
	);
}
