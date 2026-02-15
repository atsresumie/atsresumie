"use client";

import { useState, useRef, useEffect } from "react";
import {
	RotateCcw,
	LogOut,
	Coins,
	CreditCard,
	ArrowUpCircle,
	HelpCircle,
	LayoutDashboard,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
				<Image
					src="/logo.png"
					alt="atsresumie logo"
					width={56}
					height={56}
					className="h-14 w-14"
				/>
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
						Preview (1 Credit) • Export free
					</div>
				)}

				{/* User Menu */}
				{isAuthenticated && (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<motion.button
								className="rounded-full focus:outline-none focus:ring-2 focus:ring-[rgba(233,221,199,0.3)] focus:ring-offset-2 focus:ring-offset-[#1a120e]"
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
								aria-label="User menu"
							>
								<Avatar className="h-9 w-9 cursor-pointer border-2 border-[rgba(233,221,199,0.15)] hover:border-[rgba(233,221,199,0.3)] transition-colors">
									{user?.user_metadata?.avatar_url && (
										<AvatarImage
											src={user.user_metadata.avatar_url}
											alt="User avatar"
										/>
									)}
									<AvatarFallback className="bg-[rgba(233,221,199,0.1)] text-[#E9DDC7] text-sm font-medium">
										{user?.email?.charAt(0).toUpperCase() ||
											"U"}
									</AvatarFallback>
								</Avatar>
							</motion.button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-56">
							{/* User Email */}
							<DropdownMenuLabel className="font-normal">
								<div className="flex flex-col space-y-1">
									<p className="text-sm font-medium leading-none">
										Account
									</p>
									<p className="text-xs leading-none text-muted-foreground truncate">
										{user?.email}
									</p>
								</div>
							</DropdownMenuLabel>

							<DropdownMenuSeparator />

							{/* Credits */}
							<div className="px-2 py-1.5">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2 text-sm">
										<CreditCard
											size={14}
											className="text-muted-foreground"
										/>
										<span>Credits remaining</span>
									</div>
									<span className="text-sm font-medium">
										<span
											className={
												credits === 0
													? "text-destructive"
													: credits !== null &&
														  credits <= 1
														? "text-yellow-500"
														: ""
											}
										>
											{credits ?? "—"}
										</span>
									</span>
								</div>
							</div>

							<DropdownMenuSeparator />

							{/* Upgrade */}
							<DropdownMenuItem
								onClick={() => {
									window.location.href = "/#pricing";
								}}
								className="cursor-pointer"
							>
								<ArrowUpCircle size={16} className="mr-2" />
								Upgrade
							</DropdownMenuItem>

							{/* Support */}
							<DropdownMenuItem
								asChild
								className="cursor-pointer"
							>
								<a href="mailto:support@atsresumie.com">
									<HelpCircle size={16} className="mr-2" />
									Support
								</a>
							</DropdownMenuItem>

							<DropdownMenuSeparator />

							{/* Logout */}
							<DropdownMenuItem
								onClick={handleSignOut}
								className="cursor-pointer text-destructive focus:text-destructive"
							>
								<LogOut size={16} className="mr-2" />
								Log out
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				)}
			</div>
		</div>
	);
}
