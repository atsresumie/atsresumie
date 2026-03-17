"use client";

import Link from "next/link";
import { Menu, Bell } from "lucide-react";
import { ProfileDropdown } from "@/components/shared/ProfileDropdown";
import { cn } from "@/lib/utils";

/**
 * DashboardHeader - Minimal top bar with hamburger, user info and notifications.
 * Sits to the right of the sidebar on desktop.
 */

interface DashboardHeaderProps {
	onToggleSidebar: () => void;
}

export function DashboardHeader({ onToggleSidebar }: DashboardHeaderProps) {
	return (
		<header
			className={cn(
				"fixed top-0 right-0 z-40",
				"left-0 md:left-64",
				"h-14 md:h-16",
				"bg-surface-base",
				"border-b border-border-subtle",
			)}
		>
			<div className="h-full px-4 md:px-6">
				<div className="flex items-center justify-between h-full">
					{/* Left: Hamburger (mobile only) */}
					<div className="flex items-center gap-3">
						<button
							onClick={onToggleSidebar}
							className={cn(
								"p-2 -ml-2",
								"text-text-secondary hover:text-text-primary",
								"transition-colors duration-150",
								"rounded-sm",
								"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
							)}
							aria-label="Toggle sidebar"
						>
							<Menu size={20} />
						</button>
					</div>

					{/* Right: User + Notifications */}
					<div className="flex items-center gap-3">
						<span className="text-sm text-text-secondary font-medium">User</span>
						<button
							className="p-2 text-text-secondary hover:text-text-primary transition-colors rounded-sm"
							aria-label="Notifications"
						>
							<Bell size={18} />
						</button>
					</div>
				</div>
			</div>
		</header>
	);
}
