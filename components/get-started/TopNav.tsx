"use client";

import { useState, useRef, useEffect } from "react";
import { RotateCcw, User, LogOut, Coins } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";

interface TopNavProps {
	onReset: () => void;
}

export default function TopNav({ onReset }: TopNavProps) {
	const { user, isAuthenticated, signOut } = useAuth();
	const { credits } = useCredits();
	const [showMenu, setShowMenu] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);

	// Animation state for credit deduction
	const [isAnimating, setIsAnimating] = useState(false);
	const [showDeduction, setShowDeduction] = useState(false);
	const prevCreditsRef = useRef<number | null>(null);

	// Detect credit decrease and trigger animation
	useEffect(() => {
		if (credits !== null && prevCreditsRef.current !== null) {
			if (credits < prevCreditsRef.current) {
				// Credit was deducted - trigger animation
				setTimeout(() => {
					setIsAnimating(true);
					setShowDeduction(true);
				}, 0);

				// Hide the "-1" after animation completes
				const deductionTimer = setTimeout(() => {
					setShowDeduction(false);
				}, 1000);

				// Reset pulse animation
				const pulseTimer = setTimeout(() => {
					setIsAnimating(false);
				}, 600);

				return () => {
					clearTimeout(deductionTimer);
					clearTimeout(pulseTimer);
				};
			}
		}
		prevCreditsRef.current = credits;
	}, [credits]);

	// Close menu when clicking outside
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				menuRef.current &&
				!menuRef.current.contains(event.target as Node)
			) {
				setShowMenu(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () =>
			document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const handleSignOut = async () => {
		await signOut();
		setShowMenu(false);
	};

	return (
		<div className="relative z-20 mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5">
			<div className="flex items-center gap-2">
				<div className="h-8 w-8 rounded-xl bg-linear-to-br from-[#3B2A21] to-[#C8B08A] shadow-[0_0_0_1px_rgba(233,221,199,0.15)]" />
				<Link href="/" className="font-semibold tracking-tight">
					atsresumie
				</Link>
			</div>

			<div className="flex items-center gap-3">
				<button
					onClick={onReset}
					className="hidden rounded-xl border border-[rgba(233,221,199,0.15)] bg-[rgba(233,221,199,0.06)] px-3 py-2 text-sm hover:bg-[rgba(233,221,199,0.10)] md:inline-flex"
				>
					<RotateCcw className="mr-2 h-4 w-4" />
					Reset
				</button>

				{isAuthenticated && (
					<Link
						href="/dashboard"
						className="hidden rounded-xl border border-[rgba(233,221,199,0.15)] bg-[rgba(233,221,199,0.06)] px-3 py-2 text-sm hover:bg-[rgba(233,221,199,0.10)] md:inline-flex items-center"
					>
						Dashboard
					</Link>
				)}

				{/* Credits Badge with Animation */}
				{isAuthenticated && credits !== null && (
					<div className="relative">
						{/* Floating "-1" animation */}
						{showDeduction && (
							<span
								className="absolute -top-2 -right-2 text-xs font-bold text-red-400 animate-float-up pointer-events-none"
								style={{
									animation: "floatUp 1s ease-out forwards",
								}}
							>
								-1
							</span>
						)}
						<div
							className={`rounded-full border px-3 py-1 text-xs flex items-center gap-1.5 transition-all duration-300 ${
								credits === 0
									? "border-red-500/30 bg-red-500/10 text-red-300"
									: credits === 1
										? "border-yellow-500/30 bg-yellow-500/10 text-yellow-300"
										: "border-[rgba(233,221,199,0.15)] bg-[rgba(233,221,199,0.06)]"
							} ${isAnimating ? "scale-110 ring-2 ring-red-400/50" : ""}`}
							style={{
								transition:
									"transform 0.3s ease, box-shadow 0.3s ease",
							}}
						>
							<Coins
								className={`h-3 w-3 ${isAnimating ? "animate-bounce" : ""}`}
							/>
							{credits === 1 && <span>⚠</span>}
							<span className="tabular-nums">
								Credits: {credits}
							</span>
						</div>
					</div>
				)}

				{!isAuthenticated && (
					<div className="rounded-full border border-[rgba(233,221,199,0.15)] bg-[rgba(233,221,199,0.06)] px-3 py-1 text-xs">
						Preview free • Export uses credits
					</div>
				)}

				{/* User Menu */}
				{isAuthenticated && (
					<div className="relative z-50" ref={menuRef}>
						<button
							onClick={() => setShowMenu(!showMenu)}
							className="flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(233,221,199,0.15)] bg-[rgba(233,221,199,0.06)] hover:bg-[rgba(233,221,199,0.12)] transition-colors"
							title={user?.email || "Account"}
						>
							<User className="h-4 w-4" />
						</button>

						{showMenu && (
							<div className="absolute right-0 top-full mt-2 w-48 z-50 rounded-xl border border-[rgba(233,221,199,0.15)] bg-[#1a120e] shadow-xl overflow-hidden">
								<div className="px-4 py-3 border-b border-[rgba(233,221,199,0.1)]">
									<p className="text-xs text-[rgba(233,221,199,0.6)]">
										Signed in as
									</p>
									<p className="text-sm truncate">
										{user?.email}
									</p>
								</div>
								<button
									onClick={handleSignOut}
									className="flex w-full items-center gap-2 px-4 py-3 text-sm hover:bg-[rgba(233,221,199,0.06)] transition-colors"
								>
									<LogOut className="h-4 w-4" />
									Sign out
								</button>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
