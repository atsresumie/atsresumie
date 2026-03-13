"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { X, Mail, Lock, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface AuthModalProps {
	open: boolean;
	onClose: () => void;
	onAuthSuccess?: () => void;
	defaultTab?: "signin" | "signup";
}

export default function AuthModal({
	open,
	onClose,
	onAuthSuccess,
	defaultTab = "signup",
}: AuthModalProps) {
	const reduceMotion = useReducedMotion();
	const router = useRouter();
	const { signIn, signUp, signInWithGoogle } = useAuth();

	const [activeTab, setActiveTab] = useState<"signin" | "signup">(defaultTab);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Sync activeTab with defaultTab when modal opens
	useEffect(() => {
		if (open) {
			setActiveTab(defaultTab);
			setEmail("");
			setPassword("");
			setError(null);
		}
	}, [open, defaultTab]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setIsLoading(true);

		try {
			if (activeTab === "signup") {
				await signUp(email, password);
				// Redirect to email verification page
				onClose();
				router.push(
					`/auth/verify-email?email=${encodeURIComponent(email)}`,
				);
				return;
			} else {
				await signIn(email, password);
			}
			onAuthSuccess?.();
			onClose();
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Authentication failed",
			);
		} finally {
			setIsLoading(false);
		}
	};

	const handleGoogleSignIn = async () => {
		setError(null);
		setIsLoading(true);

		try {
			// Store intent for after OAuth redirect
			if (onAuthSuccess) {
				sessionStorage.setItem("auth_redirect_intent", "export");
			}
			await signInWithGoogle();
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Google sign-in failed",
			);
			setIsLoading(false);
		}
	};

	const resetForm = () => {
		setEmail("");
		setPassword("");
		setError(null);
	};

	const switchTab = (tab: "signin" | "signup") => {
		setActiveTab(tab);
		resetForm();
	};

	return (
		<AnimatePresence>
			{open && (
				<>
					{/* Backdrop */}
					<motion.div
						className="fixed inset-0 z-40 bg-black/30"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={onClose}
					/>

					{/* Modal */}
					<motion.div
						className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border-visible bg-surface-raised p-6 text-text-primary shadow-card backdrop-blur-xl"
						initial={
							reduceMotion
								? false
								: { opacity: 0, scale: 0.96, y: 10 }
						}
						animate={
							reduceMotion
								? undefined
								: { opacity: 1, scale: 1, y: 0 }
						}
						exit={
							reduceMotion
								? undefined
								: { opacity: 0, scale: 0.96, y: 10 }
						}
						transition={{
							type: "spring",
							stiffness: 180,
							damping: 20,
						}}
					>
						{/* Close button */}
						<button
							onClick={onClose}
							className="absolute right-4 top-4 p-1 text-text-tertiary hover:text-text-primary transition-colors"
						>
							<X size={20} />
						</button>

						{/* Tabs */}
						<div className="flex gap-1 rounded-xl bg-surface-inset p-1 mb-6">
							<button
								onClick={() => switchTab("signin")}
								className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
									activeTab === "signin"
										? "bg-surface-raised text-text-primary shadow-subtle"
										: "text-text-secondary hover:text-text-primary"
								}`}
							>
								Sign In
							</button>
							<button
								onClick={() => switchTab("signup")}
								className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
									activeTab === "signup"
										? "bg-surface-raised text-text-primary shadow-subtle"
										: "text-text-secondary hover:text-text-primary"
								}`}
							>
								Sign Up
							</button>
						</div>

						{/* Title */}
						<h2 className="text-xl font-semibold mb-1">
							{activeTab === "signup"
								? "Create your account"
								: "Welcome back"}
						</h2>
						<p className="text-sm text-text-secondary mb-6">
							{activeTab === "signup"
								? "Sign up to download your ATS-optimized resume"
								: "Sign in to access your account"}
						</p>

						{/* Google button */}
						<button
							onClick={handleGoogleSignIn}
							disabled={isLoading}
							className="w-full flex items-center justify-center gap-3 rounded-xl border border-border-visible bg-surface-base px-4 py-3 text-sm font-medium hover:bg-surface-inset transition-all disabled:opacity-50 disabled:cursor-not-allowed"
						>
							<svg className="w-5 h-5" viewBox="0 0 24 24">
								<path
									fill="#4285F4"
									d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
								/>
								<path
									fill="#34A853"
									d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
								/>
								<path
									fill="#FBBC05"
									d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
								/>
								<path
									fill="#EA4335"
									d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
								/>
							</svg>
							Continue with Google
						</button>

						{/* Divider */}
						<div className="flex items-center gap-3 my-5">
							<div className="flex-1 h-px bg-border-subtle" />
							<span className="text-xs text-text-tertiary">
								or
							</span>
							<div className="flex-1 h-px bg-border-subtle" />
						</div>

						{/* Form */}
						<form onSubmit={handleSubmit} className="space-y-4">
							<div className="relative">
								<Mail
									className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary"
									size={18}
								/>
								<input
									type="email"
									placeholder="Email address"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									required
									className="w-full rounded-xl border border-border-visible bg-surface-base px-4 py-3 pl-11 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none transition-colors"
								/>
							</div>

							<div className="relative">
								<Lock
									className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary"
									size={18}
								/>
								<input
									type="password"
									placeholder="Password"
									value={password}
									onChange={(e) =>
										setPassword(e.target.value)
									}
									required
									minLength={6}
									className="w-full rounded-xl border border-border-visible bg-surface-base px-4 py-3 pl-11 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none transition-colors"
								/>
							</div>

							{error && (
								<p className="text-sm text-red-600 bg-red-100 rounded-lg px-3 py-2">
									{error}
								</p>
							)}

							<button
								type="submit"
								disabled={isLoading}
								className="w-full rounded-xl bg-[#654844] px-4 py-3 text-sm font-semibold text-white hover:bg-[#7a5a55] hover:-translate-y-px active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2"
							>
								{isLoading && (
									<Loader2
										className="animate-spin"
										size={18}
									/>
								)}
								{activeTab === "signup"
									? "Create Account"
									: "Sign In"}
							</button>
						</form>

						{/* Footer */}
						<p className="mt-5 text-center text-xs text-text-secondary">
							{activeTab === "signup" ? (
								<>
									Already have an account?{" "}
									<button
										onClick={() => switchTab("signin")}
										className="text-text-primary font-medium hover:underline"
									>
										Sign in
									</button>
								</>
							) : (
								<>
									Don&apos;t have an account?{" "}
									<button
										onClick={() => switchTab("signup")}
										className="text-text-primary font-medium hover:underline"
									>
										Sign up
									</button>
								</>
							)}
						</p>
					</motion.div>
				</>
			)}
		</AnimatePresence>
	);
}
