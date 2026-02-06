"use client";

import { useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type AuthIntentType =
	| "buy_credits"
	| "export_pdf"
	| "generate"
	| "navigate";

export interface AuthIntent {
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

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = "auth_intent";
const LOCK_KEY = "auth_intent_lock";
const INTENT_TTL_MS = 15 * 60 * 1000; // 15 minutes
const LOCK_TTL_MS = 30 * 1000; // 30 seconds

// Known valid pack IDs for validation
const VALID_PACK_IDS = ["pro_75"];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function generateId(): string {
	return crypto.randomUUID();
}

function isValidUUID(str: unknown): str is string {
	if (typeof str !== "string") return false;
	return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
		str,
	);
}

function isValidInternalPath(path: unknown): path is string {
	if (typeof path !== "string") return false;
	// Must start with "/" and not contain protocol
	return path.startsWith("/") && !path.includes("://");
}

// ─────────────────────────────────────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────────────────────────────────────

function validatePayload(intent: AuthIntent): boolean {
	switch (intent.type) {
		case "buy_credits": {
			const packId = intent.payload.packId;
			if (typeof packId !== "string") return false;
			if (!VALID_PACK_IDS.includes(packId)) return false;
			return true;
		}
		case "export_pdf": {
			const jobId = intent.payload.jobId;
			return isValidUUID(jobId);
		}
		case "generate":
			// No required payload
			return true;
		case "navigate": {
			return isValidInternalPath(intent.returnTo);
		}
		default:
			return false;
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// Storage Operations
// ─────────────────────────────────────────────────────────────────────────────

function getStoredIntent(): AuthIntent | null {
	if (typeof window === "undefined") return null;
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return null;
		const intent = JSON.parse(raw) as AuthIntent;
		// Check expiry
		if (Date.now() > intent.expiresAt) {
			localStorage.removeItem(STORAGE_KEY);
			return null;
		}
		return intent;
	} catch {
		return null;
	}
}

function setStoredIntent(intent: AuthIntent): void {
	if (typeof window === "undefined") return;
	localStorage.setItem(STORAGE_KEY, JSON.stringify(intent));
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

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

export function useAuthIntent() {
	const router = useRouter();
	const replayingRef = useRef(false);

	/**
	 * Save an intent to be replayed after authentication
	 */
	const saveIntent = useCallback(
		(params: {
			type: AuthIntentType;
			payload?: Record<string, unknown>;
			returnTo?: string;
		}) => {
			const now = Date.now();
			const intent: AuthIntent = {
				id: generateId(),
				type: params.type,
				payload: params.payload || {},
				returnTo: params.returnTo,
				createdAt: now,
				expiresAt: now + INTENT_TTL_MS,
				version: 1,
			};
			setStoredIntent(intent);
			return intent;
		},
		[],
	);

	/**
	 * Get the current valid intent (if any)
	 */
	const getIntent = useCallback((): AuthIntent | null => {
		return getStoredIntent();
	}, []);

	/**
	 * Clear the stored intent
	 */
	const clearIntent = useCallback(() => {
		clearStoredIntent();
		clearReplayLock();
	}, []);

	/**
	 * Replay the stored intent after successful authentication
	 * Returns true if an intent was replayed, false otherwise
	 */
	const replayIntent = useCallback(async (): Promise<boolean> => {
		// Prevent concurrent replays
		if (replayingRef.current) return false;

		const intent = getStoredIntent();
		if (!intent) return false;

		// Check replay lock
		const lock = getReplayLock();
		if (
			lock?.intentId === intent.id &&
			Date.now() - lock.lockedAt < LOCK_TTL_MS
		) {
			// Already being replayed
			return false;
		}

		// Validate payload
		if (!validatePayload(intent)) {
			console.warn(
				"[AuthIntent] Invalid payload, discarding intent:",
				intent,
			);
			clearStoredIntent();
			clearReplayLock();
			return false;
		}

		// Set lock
		replayingRef.current = true;
		setReplayLock({ intentId: intent.id, lockedAt: Date.now() });

		try {
			switch (intent.type) {
				case "buy_credits": {
					const packId = intent.payload.packId as string;
					// Navigate to credits page first for context
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
						// Fallback: stay on credits page
						clearStoredIntent();
						clearReplayLock();
						return true;
					}

					// Redirect to Stripe
					clearStoredIntent();
					clearReplayLock();
					window.location.href = data.url;
					return true;
				}

				case "export_pdf": {
					const jobId = intent.payload.jobId as string;
					// Navigate to the generation page with the job
					router.push(`/dashboard/generate?jobId=${jobId}`);
					clearStoredIntent();
					clearReplayLock();
					toast.info("Resuming your export...");
					return true;
				}

				case "generate": {
					router.push("/dashboard/generate");
					clearStoredIntent();
					clearReplayLock();
					return true;
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
					return true;
				}

				default:
					clearStoredIntent();
					clearReplayLock();
					return false;
			}
		} catch (error) {
			console.error("[AuthIntent] Replay failed:", error);
			toast.error("Failed to continue your action. Please try again.");
			clearStoredIntent();
			clearReplayLock();
			return false;
		} finally {
			replayingRef.current = false;
		}
	}, [router]);

	return {
		saveIntent,
		getIntent,
		clearIntent,
		replayIntent,
	};
}
