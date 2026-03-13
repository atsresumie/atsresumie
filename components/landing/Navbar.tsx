"use client";

import { useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Menu, X, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { ProfileDropdown } from "@/components/shared/ProfileDropdown";

const navLinks = [
	{ label: "How it works", href: "#how-it-works" },
	{ label: "Pricing", href: "#pricing" },
	{ label: "FAQ", href: "#faq" },
];

export const Navbar = () => {
	const [isOpen, setIsOpen] = useState(false);
	const { user, isAuthenticated, isLoading, signOut } = useAuth();

	const { scrollY } = useScroll();
	const backgroundColor = useTransform(
		scrollY,
		[0, 80],
		["hsla(30, 50%, 97%, 0)", "hsla(30, 50%, 97%, 0.95)"],
	);
	const backdropBlur = useTransform(
		scrollY,
		[0, 80],
		["blur(0px)", "blur(12px)"],
	);

	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "";
		}
		return () => {
			document.body.style.overflow = "";
		};
	}, [isOpen]);

	const scrollToSection = (href: string) => {
		setIsOpen(false);
		const element = document.querySelector(href);
		element?.scrollIntoView({ behavior: "smooth" });
	};

	const handleSignOut = async () => {
		await signOut();
		setIsOpen(false);
	};

	return (
		<>
			<motion.nav
				style={{ backgroundColor, backdropFilter: backdropBlur }}
				className="fixed top-0 left-0 right-0 z-50 border-b border-border/30"
			>
				<div className="container mx-auto px-4">
					<div className="flex items-center justify-between h-16 md:h-18">
						{/* Logo */}
						<Link
							href="/"
							className="flex items-center gap-2 font-display text-xl font-semibold text-foreground"
						>
							<Image
								src="/logo3.png"
								alt="atsresumie logo"
								width={36}
								height={36}
								className="w-9 h-9"
							/>
							atsresumie
						</Link>

						{/* Desktop Navigation */}
						<div className="hidden md:flex items-center gap-8">
							{navLinks.map((link) => (
								<button
									key={link.label}
									onClick={() => scrollToSection(link.href)}
									className="text-sm text-muted-foreground hover:text-foreground transition-colors"
								>
									{link.label}
								</button>
							))}

							{/* Auth Controls */}
							{!isLoading && (
								<>
									{isAuthenticated ? (
										<div className="flex items-center gap-3">
											<Link
												href="/dashboard"
												className="px-4 py-2 text-sm font-medium rounded-lg transition-all inline-flex items-center gap-2 bg-surface-inset text-foreground hover:bg-surface-raised"
											>
												<LayoutDashboard size={15} />
												Dashboard
											</Link>
											<ProfileDropdown />
										</div>
									) : (
										<div className="flex items-center gap-4">
											<Link
												href="/auth/login"
												className="text-sm text-muted-foreground hover:text-foreground transition-colors"
											>
												Sign in
											</Link>
											<Link
												href="/get-started"
												className="px-5 py-2 rounded-lg text-sm font-medium bg-cta text-cta-foreground hover:bg-cta-hover transition-colors"
											>
												Start free
											</Link>
										</div>
									)}
								</>
							)}
						</div>

						{/* Mobile Menu Button */}
						<button
							onClick={() => setIsOpen(!isOpen)}
							className="md:hidden p-2 text-foreground"
						>
							{isOpen ? <X size={24} /> : <Menu size={24} />}
						</button>
					</div>
				</div>
			</motion.nav>

			{/* Mobile Menu */}
			{isOpen && (
				<div className="fixed inset-0 z-40 md:hidden bg-background/98 backdrop-blur-xl">
					<div className="flex flex-col items-center justify-center h-full gap-8">
						{navLinks.map((link) => (
							<button
								key={link.label}
								onClick={() => scrollToSection(link.href)}
								className="text-2xl font-display font-medium text-foreground"
							>
								{link.label}
							</button>
						))}

						{/* Mobile Auth */}
						{!isLoading && (
							<>
								{isAuthenticated ? (
									<Link
										href="/dashboard"
										onClick={() => setIsOpen(false)}
										className="px-6 py-3 bg-surface-inset text-foreground font-medium text-lg rounded-xl inline-flex items-center gap-2"
									>
										<LayoutDashboard size={20} />
										Dashboard
									</Link>
								) : (
									<div className="flex flex-col items-center gap-4">
										<Link
											href="/auth/login"
											onClick={() => setIsOpen(false)}
											className="text-lg text-muted-foreground"
										>
											Sign in
										</Link>
										<Link
											href="/get-started"
											onClick={() => setIsOpen(false)}
											className="px-8 py-3 bg-cta text-cta-foreground font-medium text-lg rounded-xl"
										>
											Start free
										</Link>
									</div>
								)}
							</>
						)}
					</div>
				</div>
			)}
		</>
	);
};
