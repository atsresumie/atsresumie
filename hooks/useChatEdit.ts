"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
	CHAT_HISTORY_MAX_TURNS,
	CHAT_HISTORY_STORAGE_KEY_PREFIX,
	type ChatMessage,
} from "@/types/chat";

interface UseChatEditArgs {
	jobId: string;
	enabled: boolean;
	onApplied: (args: { pdfUrl: string; latex: string }) => void;
}

interface UseChatEditReturn {
	messages: ChatMessage[];
	isSending: boolean;
	send: (message: string) => Promise<void>;
	clear: () => void;
}

const genId = () =>
	typeof crypto !== "undefined" && "randomUUID" in crypto
		? crypto.randomUUID()
		: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function useChatEdit({
	jobId,
	enabled,
	onApplied,
}: UseChatEditArgs): UseChatEditReturn {
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [isSending, setIsSending] = useState(false);
	const hydratedRef = useRef(false);

	const storageKey = `${CHAT_HISTORY_STORAGE_KEY_PREFIX}${jobId}`;

	// Hydrate from localStorage once
	useEffect(() => {
		if (!enabled || !jobId || hydratedRef.current) return;
		hydratedRef.current = true;

		try {
			const raw = localStorage.getItem(storageKey);
			if (!raw) return;
			const parsed = JSON.parse(raw);
			if (!Array.isArray(parsed)) return;
			const restored: ChatMessage[] = parsed
				.filter(
					(m: unknown): m is ChatMessage =>
						!!m &&
						typeof m === "object" &&
						typeof (m as ChatMessage).id === "string" &&
						typeof (m as ChatMessage).content === "string" &&
						((m as ChatMessage).role === "user" ||
							(m as ChatMessage).role === "assistant"),
				)
				// Drop any in-flight bubbles from a prior session.
				.map((m) =>
					m.status === "applying"
						? { ...m, status: "error" as const, content: m.content }
						: m,
				);
			setMessages(restored);
		} catch {
			// Ignore corrupt storage
		}
	}, [enabled, jobId, storageKey]);

	// Persist to localStorage on change (post-hydration)
	useEffect(() => {
		if (!hydratedRef.current) return;
		try {
			const trimmed = messages.slice(-CHAT_HISTORY_MAX_TURNS * 2);
			localStorage.setItem(storageKey, JSON.stringify(trimmed));
		} catch {
			// Ignore quota errors
		}
	}, [messages, storageKey]);

	const send = useCallback(
		async (rawMessage: string) => {
			const message = rawMessage.trim();
			if (!message || isSending) return;

			const userMsg: ChatMessage = {
				id: genId(),
				role: "user",
				content: message,
				createdAt: Date.now(),
				status: "done",
			};
			const placeholderId = genId();
			const placeholder: ChatMessage = {
				id: placeholderId,
				role: "assistant",
				content: "Applying your edit…",
				createdAt: Date.now(),
				status: "applying",
			};

			// Snapshot history BEFORE the new user turn so the server sees prior context.
			const historyForRequest = messages
				.filter((m) => m.status !== "applying" && m.status !== "error")
				.slice(-CHAT_HISTORY_MAX_TURNS)
				.map((m) => ({ role: m.role, content: m.content }));

			setMessages((prev) => [...prev, userMsg, placeholder]);
			setIsSending(true);

			try {
				const res = await fetch("/api/chat-edit", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						jobId,
						message,
						history: historyForRequest,
					}),
				});

				const data = await res.json();

				if (!res.ok) {
					setMessages((prev) =>
						prev.map((m) =>
							m.id === placeholderId
								? {
										...m,
										content: data.error || "Couldn't apply that change",
										status: "error",
									}
								: m,
						),
					);
					return;
				}

				const summary: string = data.summary || "Applied your edit.";
				const pdfUrl: string = data.pdfUrl;
				const latex: string = data.latex;

				setMessages((prev) =>
					prev.map((m) =>
						m.id === placeholderId
							? { ...m, content: summary, status: "done" }
							: m,
					),
				);

				onApplied({ pdfUrl, latex });
			} catch (err) {
				console.error("[useChatEdit] send failed:", err);
				setMessages((prev) =>
					prev.map((m) =>
						m.id === placeholderId
							? {
									...m,
									content:
										err instanceof Error
											? err.message
											: "Network error",
									status: "error",
								}
							: m,
					),
				);
			} finally {
				setIsSending(false);
			}
		},
		[isSending, jobId, messages, onApplied],
	);

	const clear = useCallback(() => {
		setMessages([]);
		try {
			localStorage.removeItem(storageKey);
		} catch {
			// Ignore
		}
	}, [storageKey]);

	return { messages, isSending, send, clear };
}
