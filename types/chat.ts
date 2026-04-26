export type ChatRole = "user" | "assistant";

export type ChatStatus = "applying" | "done" | "error";

export interface ChatMessage {
	id: string;
	role: ChatRole;
	content: string;
	createdAt: number;
	status?: ChatStatus;
}

export const CHAT_HISTORY_STORAGE_KEY_PREFIX = "atsresumie_chat_history_";
export const CHAT_HISTORY_MAX_TURNS = 20;
