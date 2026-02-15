"use client";

import {
	createContext,
	useContext,
	useState,
	useCallback,
	useRef,
	type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import AuthModal from "@/components/auth/AuthModal";

// ─────────────────────────────────────────────────────────────────────────────
// Auth Intent Types (inline to avoid circular deps)
// ─────────────────────────────────────────────────────────────────────────────

type AuthIntentType = "buy_credits" | "export_pdf" | "generate" | "navigate";

interface AuthIntent {
	id: string;
	type: AuthIntentType;
	payload: Record<string, unknown>;
	returnTo?: string;
	createdAt: number;
	expiresAt: number;
	version: 1;
}

interface ReplayLock {
	intentId: string;
	lockedAt: number;
}

const STORAGE_KEY = "auth_intent";
const LOCK_KEY = "auth_intent_lock";
const LOCK_TTL_MS = 30 * 1000;
const VALID_PACK_IDS = ["pro_75"];

// ─────────────────────────────────────────────────────────────────────────────
// Storage helpers
// ─────────────────────────────────────────────────────────────────────────────

function getStoredIntent(): AuthIntent | null {
	if (typeof window === "undefined") return null;
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return null;
		const intent = JSON.parse(raw) as AuthIntent;
		if (Date.now() > intent.expiresAt) {
			localStorage.removeItem(STORAGE_KEY);
			return null;
		}
		return intent;
	} catch {
		return null;
	}
}

function clearStoredIntent(): void {
	if (typeof window === "undefined") return;
	localStorage.removeItem(STORAGE_KEY);
}

function getReplayLock(): ReplayLock | null {
	if (typeof window === "undefined") return null;
	try {
		const raw = localStorage.getItem(LOCK_KEY);
		if (!raw) return null;
		return JSON.parse(raw) as ReplayLock;
	} catch {
		return null;
	}
}

function setReplayLock(lock: ReplayLock): void {
	if (typeof window === "undefined") return;
	localStorage.setItem(LOCK_KEY, JSON.stringify(lock));
}

function clearReplayLock(): void {
	if (typeof window === "undefined") return;
	localStorage.removeItem(LOCK_KEY);
}

function isValidUUID(str: unknown): str is string {
	if (typeof str !== "string") return false;
	return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
		str,
	);
}

function isValidInternalPath(path: unknown): path is string {
	if (typeof path !== "string") return false;
	return path.startsWith("/") && !path.includes("://");
}

function validatePayload(intent: AuthIntent): boolean {
	switch (intent.type) {
		case "buy_credits": {
			const packId = intent.payload.packId;
			return (
				typeof packId === "string" && VALID_PACK_IDS.includes(packId)
			);
		}
		case "export_pdf":
			return isValidUUID(intent.payload.jobId);
		case "generate":
			return true;
		case "navigate":
			return isValidInternalPath(intent.returnTo);
		default:
			return false;
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────

type AuthTab = "signin" | "signup";

interface AuthModalContextType {
	openAuthModal: (tab?: AuthTab) => void;
	closeAuthModal: () => void;
}

const AuthModalContext = createContext<AuthModalContextType | null>(null);

export function useAuthModal() {
	const context = useContext(AuthModalContext);
	if (!context) {
		throw new Error("useAuthModal must be used within AuthModalProvider");
	}
	return context;
}

export function AuthModalProvider({ children }: { children: ReactNode }) {
	const router = useRouter();
	const [isOpen, setIsOpen] = useState(false);
	const [defaultTab, setDefaultTab] = useState<AuthTab>("signin");
	const replayingRef = useRef(false);

	const openAuthModal = useCallback((tab: AuthTab = "signin") => {
		setDefaultTab(tab);
		setIsOpen(true);
	}, []);

	const closeAuthModal = useCallback(() => {
		setIsOpen(false);
	}, []);

	/**
	 * CENTRALIZED REPLAY: This is the ONLY place that replays auth intents
	 */
	const handleAuthSuccess = useCallback(async () => {
		console.log("[AuthModalContext] handleAuthSuccess called");
		setIsOpen(false);

		// Prevent concurrent replays
		if (replayingRef.current) {
			console.log("[AuthModalContext] Already replaying, skipping");
			return;
		}

		const intent = getStoredIntent();
		console.log("[AuthModalContext] Retrieved intent:", intent);
		if (!intent) {
			console.log("[AuthModalContext] No intent found");
			return;
		}

		// Check replay lock
		const lock = getReplayLock();
		if (
			lock?.intentId === intent.id &&
			Date.now() - lock.lockedAt < LOCK_TTL_MS
		) {
			console.log("[AuthModalContext] Replay locked, skipping");
			return; // Already being replayed
		}

		// Validate payload
		if (!validatePayload(intent)) {
			console.warn("[AuthIntent] Invalid payload, discarding:", intent);
			clearStoredIntent();
			clearReplayLock();
			return;
		}

		// Set lock
		replayingRef.current = true;
		setReplayLock({ intentId: intent.id, lockedAt: Date.now() });

		try {
			switch (intent.type) {
				case "buy_credits": {
					const packId = intent.payload.packId as string;

					// Navigate to credits page for context
					router.push("/dashboard/credits");

					// Create checkout session
					const res = await fetch("/api/stripe/checkout", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ packId }),
					});

					const data = await res.json();

					if (!res.ok || !data.url) {
						toast.error(data.error || "Failed to start checkout");
						clearStoredIntent();
						clearReplayLock();
						return;
					}

					// Redirect to Stripe
					clearStoredIntent();
					clearReplayLock();
					window.location.href = data.url;
					return;
				}

				case "export_pdf": {
					const jobId = intent.payload.jobId as string;
					router.push(`/dashboard/generate?jobId=${jobId}`);
					clearStoredIntent();
					clearReplayLock();
					toast.info("Resuming your export...");
					return;
				}

				case "generate": {
					router.push("/dashboard/generate");
					clearStoredIntent();
					clearReplayLock();
					return;
				}

				case "navigate": {
					if (
						intent.returnTo &&
						isValidInternalPath(intent.returnTo)
					) {
						router.push(intent.returnTo);
					}
					clearStoredIntent();
					clearReplayLock();
					return;
				}
			}
		} catch (error) {
			console.error("[AuthIntent] Replay failed:", error);
			toast.error("Failed to continue your action. Please try again.");
			clearStoredIntent();
			clearReplayLock();
		} finally {
			replayingRef.current = false;
		}
	}, [router]);

	return (
		<AuthModalContext.Provider value={{ openAuthModal, closeAuthModal }}>
			{children}
			<AuthModal
				open={isOpen}
				onClose={closeAuthModal}
				onAuthSuccess={handleAuthSuccess}
				defaultTab={defaultTab}
			/>
		</AuthModalContext.Provider>
	);
}
