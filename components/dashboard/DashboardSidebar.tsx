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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

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

	const handleLinkClick = () => {
		// Close sidebar on mobile when link is clicked
		onClose();
	};

	const handleSignOut = async () => {
		await signOut();
		router.push("/");
	};

	const [isUpgrading, setIsUpgrading] = useState(false);

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
					className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
					onClick={onClose}
				/>
			)}

			{/* Sidebar */}
			<aside
				className={cn(
					"fixed left-0 top-16 z-50 h-[calc(100vh-4rem)] w-64 border-r border-t border-border bg-background transition-transform duration-300 md:top-20 md:h-[calc(100vh-5rem)] flex flex-col",
					"md:translate-x-0 md:transition-none",
					isOpen ? "translate-x-0" : "-translate-x-full",
				)}
			>
				{/* Mobile close button */}
				<button
					onClick={onClose}
					className="absolute right-3 top-3 p-1.5 text-muted-foreground hover:text-foreground md:hidden"
					aria-label="Close sidebar"
				>
					<X size={20} />
				</button>

				{/* Navigation links */}
				<nav className="flex flex-col gap-1 p-4 pt-10 md:pt-4 flex-1">
					{sidebarLinks.map((link) => {
						const isActive =
							pathname === link.href ||
							(link.href !== "/dashboard" &&
								pathname.startsWith(link.href));
						const Icon = link.icon;

						return (
							<Link
								key={link.href}
								href={link.href}
								onClick={handleLinkClick}
								className={cn(
									"flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
									isActive
										? "bg-muted text-foreground"
										: "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
								)}
							>
								<Icon size={18} />
								{link.label}
							</Link>
						);
					})}
				</nav>

				{/* Bottom section */}
				<div className="p-4 border-t border-border space-y-2">
					{/* Upgrade to Pro */}
					<Button
						variant="default"
						className="w-full gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
						onClick={handleUpgrade}
						disabled={isUpgrading}
					>
						{isUpgrading ? (
							<>
								<Loader2 size={16} className="animate-spin" />
								Loading...
							</>
						) : (
							<>
								<Crown size={16} />
								Upgrade to Pro
							</>
						)}
					</Button>

					{/* Sign Out */}
					<Button
						variant="ghost"
						className="w-full gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
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
