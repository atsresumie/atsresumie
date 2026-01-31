"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import AuthModal from "@/components/auth/AuthModal";
import { HeaderAuthControls } from "@/components/landing/HeaderAuthControls";

const navLinks = [
	{ label: "Pricing", href: "/#pricing" },
	{ label: "How it works", href: "/#how-it-works" },
	{ label: "FAQ", href: "/#faq" },
];

interface DashboardHeaderProps {
	onToggleSidebar: () => void;
}

export function DashboardHeader({ onToggleSidebar }: DashboardHeaderProps) {
	const [showAuthModal, setShowAuthModal] = useState(false);
	const [authModalTab, setAuthModalTab] = useState<"signin" | "signup">(
		"signin",
	);
	const pathname = usePathname();

	return (
		<>
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

							{/* Logo */}
							<Link
								href="/"
								className="font-display text-xl md:text-2xl font-semibold text-foreground hover:opacity-90 transition-opacity"
							>
								atsresumie
							</Link>
						</div>

						{/* Desktop Navigation */}
						<div className="hidden md:flex items-center gap-6">
							{navLinks.map((link) => (
								<Link
									key={link.label}
									href={link.href}
									className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
								>
									{link.label}
								</Link>
							))}

							{/* Auth Controls */}
							<HeaderAuthControls
								onOpenAuthModal={(tab) => {
									setAuthModalTab(tab);
									setShowAuthModal(true);
								}}
							/>
						</div>

						{/* Mobile: just show auth controls */}
						<div className="md:hidden">
							<HeaderAuthControls
								onOpenAuthModal={(tab) => {
									setAuthModalTab(tab);
									setShowAuthModal(true);
								}}
							/>
						</div>
					</div>
				</div>
			</nav>

			{/* Auth Modal */}
			<AuthModal
				open={showAuthModal}
				onClose={() => setShowAuthModal(false)}
				defaultTab={authModalTab}
			/>
		</>
	);
}
