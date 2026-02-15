"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
	Home,
	Sparkles,
	History,
	Bookmark,
	FileText,
	Download,
	CreditCard,
	X,
	Crown,
	LogOut,
	Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";
import { usePurchaseHistory } from "@/hooks/usePurchaseHistory";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/**
 * DashboardSidebar - The Résumé Atelier Design System
 *
 * Editorial-styled sidebar with underline-style active states.
 */

const sidebarLinks = [
	{ label: "Dashboard", href: "/dashboard", icon: Home },
	{ label: "Generate", href: "/dashboard/generate", icon: Sparkles },
	{
		label: "Past Generations",
		href: "/dashboard/generations",
		icon: History,
	},
	{ label: "Saved JDs", href: "/dashboard/saved-jds", icon: Bookmark },
	{ label: "Resume Versions", href: "/dashboard/resumes", icon: FileText },
	{ label: "Download Center", href: "/dashboard/downloads", icon: Download },
	{
		label: "Credits & Billing",
		href: "/dashboard/credits",
		icon: CreditCard,
	},
];

interface DashboardSidebarProps {
	isOpen: boolean;
	onClose: () => void;
}

export function DashboardSidebar({ isOpen, onClose }: DashboardSidebarProps) {
	const pathname = usePathname();
	const router = useRouter();
	const { signOut } = useAuth();
	const { credits } = useCredits();
	const { purchases } = usePurchaseHistory();
	const [isUpgrading, setIsUpgrading] = useState(false);

	const hasPurchasedBefore = purchases.some((p) => p.status === "succeeded");
	const shouldShowBuyMore =
		!hasPurchasedBefore || credits === null || credits <= 15;

	const handleLinkClick = () => {
		onClose();
	};

	const handleSignOut = async () => {
		await signOut();
		router.push("/");
	};

	const handleUpgrade = async () => {
		if (isUpgrading) return;
		setIsUpgrading(true);
		try {
			const res = await fetch("/api/stripe/checkout", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ packId: "pro_75" }),
			});
			const data = await res.json();
			if (!res.ok) {
				throw new Error(data.error || "Failed to start checkout");
			}
			if (data.url) {
				window.location.href = data.url;
			}
		} catch (error) {
			console.error("Checkout error:", error);
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to start checkout",
			);
			setIsUpgrading(false);
		}
	};

	return (
		<>
			{/* Mobile overlay */}
			{isOpen && (
				<div
					className="fixed inset-0 z-40 bg-surface-base/80 backdrop-blur-sm md:hidden"
					onClick={onClose}
					aria-hidden="true"
				/>
			)}

			{/* Sidebar */}
			<aside
				className={cn(
					// Positioning
					"fixed left-0 z-50",
					"top-14 md:top-16",
					"h-[calc(100vh-3.5rem)] md:h-[calc(100vh-4rem)]",
					"w-64",
					// Styling
					"bg-surface-base",
					"border-r border-border-subtle",
					// Layout
					"flex flex-col",
					// Transitions
					"transition-transform duration-200 ease-out",
					"md:translate-x-0",
					isOpen ? "translate-x-0" : "-translate-x-full",
				)}
			>
				{/* Mobile close button */}
				<button
					onClick={onClose}
					className={cn(
						"absolute right-3 top-3 p-1.5 md:hidden",
						"text-text-tertiary hover:text-text-primary",
						"rounded-sm",
						"transition-colors duration-150",
						"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
					)}
					aria-label="Close sidebar"
				>
					<X size={18} />
				</button>

				{/* Navigation links */}
				<nav className="flex-1 overflow-y-auto p-4 pt-10 md:pt-4">
					<ul className="flex flex-col gap-1">
						{sidebarLinks.map((link) => {
							const isActive =
								pathname === link.href ||
								(link.href !== "/dashboard" &&
									pathname.startsWith(link.href));
							const Icon = link.icon;

							return (
								<li key={link.href}>
									<Link
										href={link.href}
										onClick={handleLinkClick}
										className={cn(
											// Base
											"flex items-center gap-3",
											"px-3 py-2.5",
											"text-sm font-medium",
											"rounded-sm",
											"transition-colors duration-150",
											// States
											isActive
												? "bg-surface-raised text-text-primary border-l-2 border-accent -ml-[2px] pl-[14px]"
												: "text-text-secondary hover:text-text-primary hover:bg-surface-raised",
										)}
									>
										<Icon size={18} />
										{link.label}
									</Link>
								</li>
							);
						})}
					</ul>
				</nav>

				{/* Bottom section */}
				<div className="p-4 border-t border-border-subtle space-y-2">
					{/* Upgrade / Buy more credits — hidden for returning users with plenty of credits */}
					{shouldShowBuyMore && (
						<Button
							variant="primary"
							className="w-full"
							onClick={handleUpgrade}
							disabled={isUpgrading}
						>
							{isUpgrading ? (
								<>
									<Loader2
										size={16}
										className="animate-spin"
									/>
									Loading...
								</>
							) : hasPurchasedBefore ? (
								<>
									<Crown size={16} />
									Buy more credits ✨
								</>
							) : (
								<>
									<Crown size={16} />
									Upgrade to Pro
								</>
							)}
						</Button>
					)}

					{/* Sign Out */}
					<Button
						variant="ghost"
						className="w-full text-text-secondary hover:text-error"
						onClick={handleSignOut}
					>
						<LogOut size={16} />
						Sign Out
					</Button>
				</div>
			</aside>
		</>
	);
}
