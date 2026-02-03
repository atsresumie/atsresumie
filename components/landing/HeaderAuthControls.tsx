"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { CreditCard } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";
import { ProfileDropdown } from "@/components/shared/ProfileDropdown";
import { Skeleton } from "@/components/ui/skeleton";

interface HeaderAuthControlsProps {
	onOpenAuthModal: (tab: "signin" | "signup") => void;
}

export function HeaderAuthControls({
	onOpenAuthModal,
}: HeaderAuthControlsProps) {
	const { isAuthenticated, isLoading: authLoading } = useAuth();
	const {
		credits,
		isLoading: creditsLoading,
		error: creditsError,
	} = useCredits();
	const pathname = usePathname();

	// Show skeleton during initial auth loading
	if (authLoading) {
		return (
			<div className="flex items-center gap-3">
				<Skeleton className="h-6 w-16 rounded-lg" />
				<Skeleton className="h-9 w-9 rounded-full" />
			</div>
		);
	}

	// Unauthenticated state (Marketing mode)
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

	// Authenticated state (App mode)
	// Credits display + Profile dropdown only
	const getCreditsDisplay = () => {
		if (creditsLoading) return "…";
		if (creditsError) return "—";
		return credits;
	};

	const getCreditsColor = () => {
		if (credits === 0) return "text-destructive";
		if (credits !== null && credits <= 1) return "text-yellow-500";
		return "text-foreground";
	};

	return (
		<div className="flex items-center gap-4">
			{/* Credits Display */}
			<Link
				href="/dashboard/credits"
				className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
			>
				<CreditCard size={14} className="text-muted-foreground" />
				<span className={`text-sm font-medium ${getCreditsColor()}`}>
					{getCreditsDisplay()}
				</span>
			</Link>

			{/* Profile Dropdown */}
			<ProfileDropdown />
		</div>
	);
}
