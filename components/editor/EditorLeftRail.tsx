"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sliders, Sparkles } from "lucide-react";
import { ChatPanel } from "./ChatPanel";
import { StyleControls } from "./StyleControls";
import type { StyleConfig } from "@/types/editor";
import type { ChatMessage } from "@/types/chat";

interface EditorLeftRailProps {
	// Style controls
	styleConfig: StyleConfig;
	onStyleChange: (config: StyleConfig) => void;
	onStyleReset: () => void;

	// Chat
	chatMessages: ChatMessage[];
	chatIsSending: boolean;
	onChatSend: (message: string) => void;
	onChatClear: () => void;
}

/**
 * Left-rail tab wrapper for the resume editor.
 *
 * Default tab is `style` (preserves existing behavior). The `chat` tab
 * exposes the AI chat-edit feature (alpha/chat-in-canvas).
 */
export function EditorLeftRail({
	styleConfig,
	onStyleChange,
	onStyleReset,
	chatMessages,
	chatIsSending,
	onChatSend,
	onChatClear,
}: EditorLeftRailProps) {
	return (
		<Tabs defaultValue="style" className="flex h-full flex-col">
			<TabsList className="grid h-10 w-full shrink-0 grid-cols-2 rounded-none border-b border-border-subtle bg-surface-raised p-1">
				<TabsTrigger value="style" className="gap-1.5 text-xs">
					<Sliders className="h-3.5 w-3.5" />
					Style
				</TabsTrigger>
				<TabsTrigger value="chat" className="gap-1.5 text-xs">
					<Sparkles className="h-3.5 w-3.5" />
					Chat
				</TabsTrigger>
			</TabsList>

			<TabsContent
				value="style"
				className="mt-0 flex-1 overflow-hidden focus-visible:outline-none"
			>
				<StyleControls
					config={styleConfig}
					onChange={onStyleChange}
					onReset={onStyleReset}
				/>
			</TabsContent>

			<TabsContent
				value="chat"
				className="mt-0 flex-1 overflow-hidden focus-visible:outline-none"
			>
				<ChatPanel
					messages={chatMessages}
					isSending={chatIsSending}
					onSend={onChatSend}
					onClear={onChatClear}
				/>
			</TabsContent>
		</Tabs>
	);
}
