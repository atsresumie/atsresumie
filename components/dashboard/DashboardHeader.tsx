"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, CreditCard } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";
import { ProfileDropdown } from "@/components/shared/ProfileDropdown";
import { FeedbackButton } from "@/components/dashboard/FeedbackModal";

interface DashboardHeaderProps {
	onToggleSidebar: () => void;
}

export function DashboardHeader({ onToggleSidebar }: DashboardHeaderProps) {
	const { isAuthenticated } = useAuth();
	const {
		credits,
		isLoading: creditsLoading,
		error: creditsError,
	} = useCredits();

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
		<nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur-md">
			<div className="container mx-auto">
				<div className="flex items-center justify-between h-16 md:h-20">
					{/* Left: Hamburger + Logo */}
					<div className="flex items-center gap-3">
						{/* Mobile hamburger */}
						<button
							onClick={onToggleSidebar}
							className="p-2 text-foreground md:hidden"
							aria-label="Toggle sidebar"
						>
							<Menu size={24} />
						</button>

						{/* Logo - links to dashboard */}
						<Link
							href="/"
							className="flex items-center gap-2 font-display text-xl md:text-2xl font-semibold text-foreground hover:opacity-90 transition-opacity"
						>
							<Image
								src="/logo.png"
								alt="atsresumie logo"
								width={56}
								height={56}
								className="w-14 h-14"
							/>
							atsresumie
						</Link>
					</div>

					{/* Right: Feedback + Credits + Profile */}
					<div className="flex items-center gap-3">
						{/* Feedback Button */}
						<FeedbackButton />

						{/* Credits Display */}
						<Link
							href="/dashboard/credits"
							className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/30 hover:bg-muted/50 border border-border/50 transition-colors"
						>
							<CreditCard
								size={14}
								className="text-muted-foreground"
							/>
							<span
								className={`text-sm font-medium ${getCreditsColor()}`}
							>
								{getCreditsDisplay()}
							</span>
						</Link>

						{/* Profile Dropdown */}
						<ProfileDropdown />
					</div>
				</div>
			</div>
		</nav>
	);
}
