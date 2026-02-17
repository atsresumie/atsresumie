"use client";

import Link from "next/link";
import Image from "next/image";
import { Menu } from "lucide-react";
import { useCredits } from "@/hooks/useCredits";
import { ProfileDropdown } from "@/components/shared/ProfileDropdown";
import { CreditsPill } from "@/components/shared/CreditsPill";
import { FeedbackButton } from "@/components/dashboard/FeedbackModal";
import { cn } from "@/lib/utils";

/**
 * DashboardHeader - The Résumé Atelier Design System
 *
 * Editorial-styled header with hairline border and centered content.
 */

interface DashboardHeaderProps {
	onToggleSidebar: () => void;
}

export function DashboardHeader({ onToggleSidebar }: DashboardHeaderProps) {
	const {
		credits,
		isLoading: creditsLoading,
		error: creditsError,
	} = useCredits();

	return (
		<header
			className={cn(
				"fixed top-0 left-0 right-0 z-50",
				"h-14 md:h-16",
				"bg-surface-base",
				"border-b border-border-subtle",
			)}
		>
			<div className="h-full px-4 md:px-6">
				<div className="flex items-center justify-between h-full">
					{/* Left: Hamburger + Logo */}
					<div className="flex items-center gap-3">
						{/* Mobile hamburger */}
						<button
							onClick={onToggleSidebar}
							className={cn(
								"p-2 -ml-2 md:hidden",
								"text-text-secondary hover:text-text-primary",
								"transition-colors duration-150",
								"rounded-sm",
								"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base",
							)}
							aria-label="Toggle sidebar"
						>
							<Menu size={20} />
						</button>

						{/* Logo - links to home */}
						<Link
							href="/"
							className={cn(
								"flex items-center gap-2",
								"font-display text-lg md:text-xl font-semibold",
								"text-text-primary",
								"hover:text-accent transition-colors duration-150",
							)}
						>
							<Image
								src="/logo3.png"
								alt="atsresumie logo"
								width={32}
								height={32}
								className="w-8 h-8"
							/>
							<span className="hidden sm:inline">atsresumie</span>
						</Link>
					</div>

					{/* Right: Feedback + Credits + Profile */}
					<div className="flex items-center gap-2 md:gap-3">
						{/* Feedback Button */}
						<FeedbackButton />

						{/* Credits Display */}
						<Link
							href="/dashboard/credits"
							className="hidden sm:block"
						>
							<CreditsPill
								credits={credits}
								isLoading={creditsLoading}
								hasError={!!creditsError}
							/>
						</Link>

						{/* Profile Dropdown */}
						<ProfileDropdown />
					</div>
				</div>
			</div>
		</header>
	);
}
