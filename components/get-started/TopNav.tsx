"use client";

import { useState, useRef, useEffect } from "react";
import { RotateCcw, User, LogOut } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

interface TopNavProps {
	onReset: () => void;
}

export default function TopNav({ onReset }: TopNavProps) {
	const { user, isAuthenticated, signOut } = useAuth();
	const [showMenu, setShowMenu] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);

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

				<div className="rounded-full border border-[rgba(233,221,199,0.15)] bg-[rgba(233,221,199,0.06)] px-3 py-1 text-xs">
					Preview free • Export uses credits
				</div>

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
