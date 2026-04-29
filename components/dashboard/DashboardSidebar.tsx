"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
	Home,
	Search,
	KanbanSquare,
	FileText,
	Scissors,
	Bookmark,
	ScanSearch,
	Settings,
	X,
	Crown,
	LogOut,
	Loader2,
	Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";
import { usePurchaseHistory } from "@/hooks/usePurchaseHistory";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/**
 * DashboardSidebar - Brown-themed sidebar with white text.
 */

const sidebarLinks = [
	{ label: "Dashboard", href: "/dashboard", icon: Home },
	{ label: "Browse Jobs", href: "/dashboard/job-search", icon: Search },
	{
		label: "My Applications",
		href: "/dashboard/applications",
		icon: KanbanSquare,
	},
	{ label: "My Resumes", href: "/dashboard/resumes", icon: FileText },
	{ label: "Tailor Resume", href: "/dashboard/generate", icon: Scissors },
	{ label: "Past Generations", href: "/dashboard/generations", icon: Bookmark },
	{
		label: "ATS Checker",
		href: "/dashboard/ats-checker",
		icon: ScanSearch,
	},
	{
		label: "Settings",
		href: "/dashboard/settings",
		icon: Settings,
	},
];

interface DashboardSidebarProps {
	isOpen: boolean;
	onClose: () => void;
}

export function DashboardSidebar({ isOpen, onClose }: DashboardSidebarProps) {
	const pathname = usePathname();
	const router = useRouter();
	const { signOut, user } = useAuth();
	const { credits } = useCredits();
	const { purchases } = usePurchaseHistory();
	const [isUpgrading, setIsUpgrading] = useState(false);
	const [isAdmin, setIsAdmin] = useState(false);

	useEffect(() => {
		fetch("/api/admin/check")
			.then((r) => r.json())
			.then((d) => setIsAdmin(d.isAdmin === true))
			.catch(() => {});
	}, []);

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

	const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
	const displayInitial = displayName.charAt(0).toUpperCase();

	return (
		<>
			{/* Mobile overlay */}
			{isOpen && (
				<div
					className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
					onClick={onClose}
					aria-hidden="true"
				/>
			)}

			{/* Sidebar */}
			<aside
				className={cn(
					// Positioning
					"fixed left-0 top-0 z-50",
					"h-screen",
					"w-64",
					// Layout
					"flex flex-col",
					// Transitions
					"transition-transform duration-200 ease-out",
					"md:translate-x-0",
					isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
				)}
				style={{ backgroundColor: "#805F4E" }}
			>
				{/* Logo / Branding at top */}
				<div className="px-4 py-4 flex items-center gap-3">
					<Link href="/" className="flex items-center gap-2.5" onClick={handleLinkClick}>
						<Image
							src="/landing/ats-logo.png"
							alt="ATSResumie logo"
							width={42}
							height={36}
							className="h-9 w-[42px] object-contain"
						/>
						<span className="text-sm font-semibold text-white">
							ATSResumie
						</span>
					</Link>
				</div>

				{/* Mobile close button */}
				<button
					onClick={onClose}
					className={cn(
						"absolute right-3 top-4 p-1.5 md:hidden",
						"text-white/60 hover:text-white",
						"rounded-sm",
						"transition-colors duration-150",
					)}
					aria-label="Close sidebar"
				>
					<X size={18} />
				</button>

				{/* Navigation links */}
				<nav className="flex-1 overflow-y-auto px-3 pt-2">
					<ul className="flex flex-col gap-0.5">
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
											"rounded-md",
											"transition-colors duration-150",
											// States
											isActive
												? "bg-white/20 text-white"
												: "text-white/75 hover:text-white hover:bg-white/10",
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
				<div className="p-3 space-y-2">
					{/* Upgrade / Buy more credits */}
					{shouldShowBuyMore && (
						<button
							onClick={handleUpgrade}
							disabled={isUpgrading}
							className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-white bg-white/15 hover:bg-white/25 transition-colors"
						>
							{isUpgrading ? (
								<>
									<Loader2
										size={16}
										className="animate-spin"
									/>
									Loading...
								</>
							) : (
								<>
									<Crown size={16} />
									<div className="text-left">
										<span className="block text-sm font-medium">Upgrade to Pro</span>
										<span className="block text-xs text-white/60">Unlock more benefits</span>
									</div>
									<Crown size={14} className="ml-auto text-white/60" />
								</>
							)}
						</button>
					)}

					{/* Admin Panel Link */}
					{isAdmin && (
						<button
							onClick={() => {
								onClose();
								router.push("/dashboard/admin");
							}}
							className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-white/75 hover:text-white hover:bg-white/10 transition-colors"
						>
							<Shield size={16} />
							Admin Panel
						</button>
					)}

					{/* User info + Sign Out */}
					<div className="flex items-center gap-3 px-3 py-2.5 border-t border-white/10 mt-1 pt-3">
						<span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-semibold text-white flex-shrink-0">
							{displayInitial}
						</span>
						<span className="text-sm text-white font-medium truncate flex-1">
							{displayName}
						</span>
						<button
							onClick={handleSignOut}
							className="p-1.5 rounded text-white/50 hover:text-white transition-colors"
							aria-label="Sign out"
						>
							<LogOut size={16} />
						</button>
					</div>
				</div>
			</aside>
		</>
	);
}
