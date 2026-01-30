"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
	LogOut,
	CreditCard,
	ArrowUpCircle,
	HelpCircle,
	LayoutDashboard,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

interface HeaderAuthControlsProps {
	onOpenAuthModal: (tab: "signin" | "signup") => void;
}

export function HeaderAuthControls({
	onOpenAuthModal,
}: HeaderAuthControlsProps) {
	const {
		user,
		isAuthenticated,
		isLoading: authLoading,
		signOut,
	} = useAuth();
	const {
		credits,
		isLoading: creditsLoading,
		error: creditsError,
	} = useCredits();
	const router = useRouter();
	const pathname = usePathname();

	const isOnDashboard = pathname === "/dashboard";

	const handleSignOut = async () => {
		await signOut();
		router.push("/");
	};

	const handleUpgrade = () => {
		// If not on home page, navigate to home first then scroll
		if (pathname !== "/") {
			router.push("/#pricing");
		} else {
			const element = document.querySelector("#pricing");
			element?.scrollIntoView({ behavior: "smooth" });
		}
	};

	// Get initials from email for avatar fallback
	const getInitials = (email: string | undefined) => {
		if (!email) return "U";
		return email.charAt(0).toUpperCase();
	};

	// Get avatar URL from user metadata (e.g., Google OAuth)
	const avatarUrl = user?.user_metadata?.avatar_url;

	// Show skeleton during initial auth loading
	if (authLoading) {
		return (
			<div className="flex items-center gap-3">
				<Skeleton className="h-9 w-24 rounded-xl" />
				<Skeleton className="h-9 w-9 rounded-full" />
			</div>
		);
	}

	// Unauthenticated state
	if (!isAuthenticated) {
		return (
			<div className="flex items-center gap-3">
				<motion.button
					onClick={() => onOpenAuthModal("signin")}
					className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
					whileHover={{ y: -1 }}
					whileTap={{ y: 0 }}
				>
					Sign in
				</motion.button>
				<motion.button
					whileHover={{ scale: 1.02, y: -1 }}
					whileTap={{ scale: 0.98 }}
				>
					<Link
						href="/get-started"
						className="px-5 py-2.5 bg-secondary text-secondary-foreground font-medium text-sm rounded-xl shadow-soft hover:shadow-glow transition-all inline-block"
					>
						Get Started
					</Link>
				</motion.button>
			</div>
		);
	}

	// Authenticated state
	return (
		<div className="flex items-center gap-3">
			{/* Dashboard Button */}
			<motion.div
				whileHover={{ scale: 1.02, y: -1 }}
				whileTap={{ scale: 0.98 }}
			>
				<Link
					href="/dashboard"
					className={`px-4 py-2 font-medium text-sm rounded-xl transition-all inline-flex items-center gap-2 ${
						isOnDashboard
							? "bg-muted/50 text-muted-foreground cursor-default"
							: "bg-secondary text-secondary-foreground shadow-soft hover:shadow-glow"
					}`}
					onClick={(e) => {
						if (isOnDashboard) e.preventDefault();
					}}
				>
					<LayoutDashboard size={16} />
					Dashboard
				</Link>
			</motion.div>

			{/* Avatar Dropdown */}
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<motion.button
						className="rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
						aria-label="User menu"
					>
						<Avatar className="h-9 w-9 cursor-pointer border-2 border-border/50 hover:border-border transition-colors">
							{avatarUrl && (
								<AvatarImage
									src={avatarUrl}
									alt="User avatar"
								/>
							)}
							<AvatarFallback className="bg-muted text-muted-foreground text-sm font-medium">
								{getInitials(user?.email)}
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
								{creditsLoading ? (
									"…"
								) : creditsError ? (
									"—"
								) : (
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
										{credits}
									</span>
								)}
							</span>
						</div>
					</div>

					<DropdownMenuSeparator />

					{/* Upgrade */}
					<DropdownMenuItem
						onClick={handleUpgrade}
						className="cursor-pointer"
					>
						<ArrowUpCircle size={16} className="mr-2" />
						Upgrade
					</DropdownMenuItem>

					{/* Support */}
					<DropdownMenuItem asChild className="cursor-pointer">
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
		</div>
	);
}
