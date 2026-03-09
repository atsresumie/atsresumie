"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

function SignUpForm() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const nextUrl = searchParams.get("next") || "/dashboard";
	const { signUp, signInWithGoogle } = useAuth();

	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setIsLoading(true);

		try {
			await signUp(email, password);
			router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Sign up failed");
		} finally {
			setIsLoading(false);
		}
	};

	const handleGoogleSignIn = async () => {
		setError(null);
		setIsLoading(true);

		try {
			const callbackUrl = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextUrl)}`;
			await signInWithGoogle(callbackUrl);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Google sign-up failed");
			setIsLoading(false);
		}
	};

	return (
		<div className="w-full max-w-lg rounded-2xl border border-[rgba(233,221,199,0.12)] bg-[rgba(20,14,11,0.95)] p-8 text-[#E9DDC7] shadow-[0_30px_100px_rgba(0,0,0,0.6)] backdrop-blur-xl">
			<h1 className="text-2xl font-semibold mb-1">Create your account</h1>
			<p className="text-sm text-[rgba(233,221,199,0.6)] mb-6">
				Sign up to generate and download your tailored resume.
				<span className="ml-1 rounded-full border border-[rgba(233,221,199,0.15)] bg-[rgba(233,221,199,0.06)] px-2 py-0.5 text-xs">
					3 free credits
				</span>
			</p>

			<button
				onClick={handleGoogleSignIn}
				disabled={isLoading}
				className="w-full flex items-center justify-center gap-3 rounded-xl border border-[rgba(233,221,199,0.15)] bg-[rgba(233,221,199,0.04)] px-4 py-3 text-sm font-medium hover:bg-[rgba(233,221,199,0.08)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
			>
				<svg className="w-5 h-5" viewBox="0 0 24 24">
					<path fill="#E9DDC7" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
					<path fill="#E9DDC7" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
					<path fill="#E9DDC7" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
					<path fill="#E9DDC7" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
				</svg>
				Continue with Google
			</button>

			<div className="flex items-center gap-3 my-5">
				<div className="flex-1 h-px bg-[rgba(233,221,199,0.12)]" />
				<span className="text-xs text-[rgba(233,221,199,0.4)]">or</span>
				<div className="flex-1 h-px bg-[rgba(233,221,199,0.12)]" />
			</div>

			<form onSubmit={handleSubmit} className="space-y-4">
				<div className="relative">
					<Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[rgba(233,221,199,0.4)]" size={18} />
					<input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full rounded-xl border border-[rgba(233,221,199,0.15)] bg-[rgba(233,221,199,0.04)] px-4 py-3 pl-11 text-sm text-[#E9DDC7] placeholder:text-[rgba(233,221,199,0.4)] focus:border-[rgba(233,221,199,0.3)] focus:outline-none transition-colors" />
				</div>
				<div className="relative">
					<Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[rgba(233,221,199,0.4)]" size={18} />
					<input type="password" placeholder="Password (min 6 characters)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="w-full rounded-xl border border-[rgba(233,221,199,0.15)] bg-[rgba(233,221,199,0.04)] px-4 py-3 pl-11 text-sm text-[#E9DDC7] placeholder:text-[rgba(233,221,199,0.4)] focus:border-[rgba(233,221,199,0.3)] focus:outline-none transition-colors" />
				</div>
				{error && (
					<p className="text-sm text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{error}</p>
				)}
				<button type="submit" disabled={isLoading} className="w-full rounded-xl bg-[#E9DDC7] px-4 py-3 text-sm font-semibold text-[#2a1e18] hover:bg-[#f5ece0] hover:-translate-y-px active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2">
					{isLoading && <Loader2 className="animate-spin" size={18} />}
					Create Account
				</button>
			</form>

			<p className="mt-5 text-center text-xs text-[rgba(233,221,199,0.5)]">
				Already have an account?{" "}
				<Link href={`/auth/login?next=${encodeURIComponent(nextUrl)}`} className="text-[#E9DDC7] hover:underline">
					Sign in
				</Link>
			</p>
		</div>
	);
}

export default function SignUpPage() {
	return (
		<div className="min-h-screen bg-[#1a120e] flex items-center justify-center px-4">
			<Suspense fallback={<div className="text-[#E9DDC7]">Loading…</div>}>
				<SignUpForm />
			</Suspense>
		</div>
	);
}
