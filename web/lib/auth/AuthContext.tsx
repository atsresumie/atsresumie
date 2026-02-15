"use client";

import {
	createContext,
	useContext,
	useEffect,
	useState,
	useCallback,
	useRef,
	ReactNode,
} from "react";
import { User, Session } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { supabaseBrowser } from "@/lib/supabase/browser";
import {
	signUpWithEmail,
	signInWithEmail,
	signInWithGoogle,
	signOut as authSignOut,
} from "./auth";

// ─────────────────────────────────────────────────────────────────────────────
// Auth Intent Types & Helpers (inline to avoid circular deps)
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
// Auth Context
// ─────────────────────────────────────────────────────────────────────────────

interface AuthContextType {
	user: User | null;
	session: Session | null;
	isLoading: boolean;
	isAuthenticated: boolean;
	signUp: (email: string, password: string) => Promise<void>;
	signIn: (email: string, password: string) => Promise<void>;
	signInWithGoogle: (redirectTo?: string) => Promise<void>;
	signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
	const router = useRouter();
	const [user, setUser] = useState<User | null>(null);
	const [session, setSession] = useState<Session | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const replayingRef = useRef(false);
	const hasReplayedRef = useRef(false);

	/**
	 * Replay stored auth intent after successful login
	 */
	const replayIntent = useCallback(async () => {
		// Only replay once per session
		if (hasReplayedRef.current) return;
		if (replayingRef.current) return;

		const intent = getStoredIntent();
		console.log("[AuthContext] Checking for intent:", intent);
		if (!intent) return;

		// Check replay lock
		const lock = getReplayLock();
		if (
			lock?.intentId === intent.id &&
			Date.now() - lock.lockedAt < LOCK_TTL_MS
		) {
			console.log("[AuthContext] Intent locked, skipping");
			return;
		}

		// Validate payload
		if (!validatePayload(intent)) {
			console.warn("[AuthContext] Invalid payload, discarding:", intent);
			clearStoredIntent();
			clearReplayLock();
			return;
		}

		// Set lock
		replayingRef.current = true;
		hasReplayedRef.current = true;
		setReplayLock({ intentId: intent.id, lockedAt: Date.now() });

		console.log("[AuthContext] Replaying intent:", intent.type);

		try {
			switch (intent.type) {
				case "buy_credits": {
					const packId = intent.payload.packId as string;
					toast.info("Continuing to checkout...");

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
						router.push("/dashboard/credits");
						return;
					}

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
					// Redirect back to get-started to continue with the existing session
					// The onboarding session and uploaded resume are preserved there
					toast.info(
						"Welcome back! Continue generating your resume.",
						{
							description:
								"Your session and resume have been preserved.",
						},
					);
					router.push("/get-started");
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
			console.error("[AuthContext] Replay failed:", error);
			toast.error("Failed to continue your action. Please try again.");
			clearStoredIntent();
			clearReplayLock();
		} finally {
			replayingRef.current = false;
		}
	}, [router]);

	useEffect(() => {
		const supabase = supabaseBrowser();

		// Get initial session
		supabase.auth.getSession().then(({ data: { session } }) => {
			setSession(session);
			setUser(session?.user ?? null);
			setIsLoading(false);

			// If user is already authenticated on mount, check for pending intent
			if (session?.user) {
				replayIntent();
			}
		});

		// Listen for auth changes
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((event, session) => {
			console.log(
				"[AuthContext] Auth state changed:",
				event,
				!!session?.user,
			);
			setSession(session);
			setUser(session?.user ?? null);
			setIsLoading(false);

			// Replay intent when user signs in
			if (event === "SIGNED_IN" && session?.user) {
				replayIntent();
			}
		});

		return () => {
			subscription.unsubscribe();
		};
	}, [replayIntent]);

	const handleSignUp = useCallback(
		async (email: string, password: string) => {
			await signUpWithEmail(email, password);
		},
		[],
	);

	const handleSignIn = useCallback(
		async (email: string, password: string) => {
			await signInWithEmail(email, password);
		},
		[],
	);

	const handleSignInWithGoogle = useCallback(async (redirectTo?: string) => {
		await signInWithGoogle(redirectTo);
	}, []);

	const handleSignOut = useCallback(async () => {
		await authSignOut();
		// Reset replay tracking on sign out
		hasReplayedRef.current = false;
	}, []);

	const value: AuthContextType = {
		user,
		session,
		isLoading,
		isAuthenticated: !!user,
		signUp: handleSignUp,
		signIn: handleSignIn,
		signInWithGoogle: handleSignInWithGoogle,
		signOut: handleSignOut,
	};

	return (
		<AuthContext.Provider value={value}>{children}</AuthContext.Provider>
	);
}

export function useAuthContext() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuthContext must be used within an AuthProvider");
	}
	return context;
}
