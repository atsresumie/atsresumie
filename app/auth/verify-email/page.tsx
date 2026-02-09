"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, RefreshCw } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/browser";

/**
 * Email verification confirmation page.
 * Shown after a user signs up with email/password.
 */
export default function VerifyEmailPage() {
	const [isResending, setIsResending] = useState(false);
	const [resendMessage, setResendMessage] = useState<string | null>(null);

	// Get email from URL params (passed from signup)
	const email =
		typeof window !== "undefined"
			? new URLSearchParams(window.location.search).get("email")
			: null;

	const handleResend = async () => {
		if (!email || isResending) return;

		setIsResending(true);
		setResendMessage(null);

		try {
			const supabase = supabaseBrowser();
			const { error } = await supabase.auth.resend({
				type: "signup",
				email,
				options: {
					emailRedirectTo: `${window.location.origin}/auth/callback`,
				},
			});

			if (error) throw error;
			setResendMessage("Verification email resent! Check your inbox.");
		} catch {
			setResendMessage("Failed to resend. Please try again.");
		} finally {
			setIsResending(false);
		}
	};

	return (
		<div className="flex min-h-screen items-center justify-center bg-[hsl(24,28%,10%)] px-4">
			<motion.div
				className="w-full max-w-md text-center"
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ type: "spring", stiffness: 120, damping: 20 }}
			>
				{/* Icon */}
				<div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[rgba(233,221,199,0.08)] ring-1 ring-[rgba(233,221,199,0.12)]">
					<Mail
						className="h-9 w-9 text-[#E9DDC7]"
						strokeWidth={1.5}
					/>
				</div>

				{/* Heading */}
				<h1 className="mb-2 font-[family-name:var(--font-display)] text-2xl font-semibold text-[#E9DDC7]">
					Check your email
				</h1>

				<p className="mb-6 text-sm leading-relaxed text-[rgba(233,221,199,0.6)]">
					We&apos;ve sent a verification link to
					{email ? (
						<>
							<br />
							<span className="font-medium text-[#E9DDC7]">
								{email}
							</span>
						</>
					) : (
						" your email address"
					)}
					. Click the link to verify your account and get started.
				</p>

				{/* Steps */}
				<div className="mx-auto mb-8 max-w-xs space-y-3 text-left">
					{[
						"Open your email inbox",
						"Click the verification link",
						"Return here to sign in",
					].map((step, i) => (
						<div
							key={i}
							className="flex items-center gap-3 rounded-lg bg-[rgba(233,221,199,0.04)] px-4 py-2.5 ring-1 ring-[rgba(233,221,199,0.08)]"
						>
							<span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[rgba(233,221,199,0.1)] text-xs font-semibold text-[#E9DDC7]">
								{i + 1}
							</span>
							<span className="text-sm text-[rgba(233,221,199,0.7)]">
								{step}
							</span>
						</div>
					))}
				</div>

				{/* Resend */}
				<div className="mb-6 space-y-2">
					<p className="text-xs text-[rgba(233,221,199,0.4)]">
						Didn&apos;t receive the email? Check your spam folder or
					</p>
					<button
						onClick={handleResend}
						disabled={isResending || !email}
						className="inline-flex items-center gap-1.5 text-sm font-medium text-[#E9DDC7] transition-colors hover:text-[rgba(233,221,199,0.8)] disabled:opacity-40 disabled:cursor-not-allowed"
					>
						<RefreshCw
							className={`h-3.5 w-3.5 ${isResending ? "animate-spin" : ""}`}
						/>
						{isResending
							? "Resending..."
							: "Resend verification email"}
					</button>
					{resendMessage && (
						<p className="text-xs text-[rgba(233,221,199,0.6)]">
							{resendMessage}
						</p>
					)}
				</div>

				{/* Back to sign in */}
				<Link
					href="/"
					className="inline-flex items-center gap-2 rounded-xl bg-[rgba(233,221,199,0.06)] px-5 py-2.5 text-sm font-medium text-[#E9DDC7] ring-1 ring-[rgba(233,221,199,0.12)] transition-all hover:bg-[rgba(233,221,199,0.1)]"
				>
					<ArrowLeft className="h-4 w-4" />
					Back to home
				</Link>
			</motion.div>
		</div>
	);
}
