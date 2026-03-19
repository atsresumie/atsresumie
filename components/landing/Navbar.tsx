"use client";

import { useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Menu, X, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { ProfileDropdown } from "@/components/shared/ProfileDropdown";

const navLinks = [
	{ label: "How It Works", href: "#how-it-works" },
	{ label: "Benefits", href: "#start" },
	{ label: "Pricing", href: "#pricing" },
	{ label: "FAQ", href: "#faq" },
];

export const Navbar = () => {
	const [isOpen, setIsOpen] = useState(false);
	const { isAuthenticated, isLoading, signOut } = useAuth();

	const { scrollY } = useScroll();
	const backgroundColor = useTransform(
		scrollY,
		[0, 80],
		["rgba(255,255,255,0)", "rgba(255,255,255,0.95)"],
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
				className="fixed top-0 left-0 right-0 z-50 border-b border-[#bdbdbd]/30"
			>
				<div className="flex items-center justify-between h-[72px] px-6 md:px-[120px]">
					{/* Logo */}
					<Link
						href="/"
						className="flex items-center gap-2.5 cursor-pointer"
					>
						<Image
							src="/landing/ats-logo.png"
							alt="ATSResumie logo"
							width={42}
							height={36}
							className="w-[42px] h-9 object-contain"
						/>
						<span className="font-semibold text-sm text-accent">
							ATSResumie
						</span>
					</Link>

					{/* Center — Nav Links (desktop) */}
					<div className="hidden md:flex items-center gap-[19px]">
						{navLinks.map((link) => (
							<button
								key={link.label}
								onClick={() => scrollToSection(link.href)}
								className="text-base text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
							>
								{link.label}
							</button>
						))}
					</div>

					{/* Right — Auth Controls (desktop) */}
					<div className="hidden md:flex items-center gap-5">
						{!isLoading && (
							<>
								{isAuthenticated ? (
									<div className="flex items-center gap-3">
										<Link
											href="/dashboard"
											className="px-4 py-3 text-base font-medium rounded-[5px] inline-flex items-center gap-2 bg-surface-inset text-text-primary hover:bg-surface-raised transition-colors cursor-pointer"
										>
											<LayoutDashboard size={16} />
											Dashboard
										</Link>
										<ProfileDropdown />
									</div>
								) : (
									<div className="flex items-center gap-5">
										<Link
											href="/auth/login"
											className="px-4 py-3 text-base font-semibold text-text-primary hover:text-accent transition-colors cursor-pointer"
										>
											Login
										</Link>
										<Link
											href="/get-started"
											className="px-4 py-3 h-10 flex items-center justify-center rounded-[5px] text-base bg-[var(--primary-brown)] text-white hover:opacity-90 transition-opacity cursor-pointer"
										>
											Get Started Free
										</Link>
									</div>
								)}
							</>
						)}
					</div>

					{/* Mobile Menu Button */}
					<button
						onClick={() => setIsOpen(!isOpen)}
						className="md:hidden p-2 text-text-primary cursor-pointer"
					>
						{isOpen ? <X size={24} /> : <Menu size={24} />}
					</button>
				</div>
			</motion.nav>

			{/* Mobile Menu */}
			{isOpen && (
				<div className="fixed inset-0 z-40 md:hidden bg-white/98 backdrop-blur-xl">
					<div className="flex flex-col items-center justify-center h-full gap-8">
						{navLinks.map((link) => (
							<button
								key={link.label}
								onClick={() => scrollToSection(link.href)}
								className="text-2xl font-display font-medium text-text-primary cursor-pointer"
							>
								{link.label}
							</button>
						))}

						{!isLoading && (
							<>
								{isAuthenticated ? (
									<Link
										href="/dashboard"
										onClick={() => setIsOpen(false)}
										className="px-6 py-3 bg-surface-inset text-text-primary font-medium text-lg rounded-[5px] inline-flex items-center gap-2 cursor-pointer"
									>
										<LayoutDashboard size={20} />
										Dashboard
									</Link>
								) : (
									<div className="flex flex-col items-center gap-4">
										<Link
											href="/auth/login"
											onClick={() => setIsOpen(false)}
											className="text-lg font-semibold text-text-primary cursor-pointer"
										>
											Login
										</Link>
										<Link
											href="/get-started"
											onClick={() => setIsOpen(false)}
											className="px-8 py-3 bg-[var(--primary-brown)] text-white font-medium text-lg rounded-[5px] cursor-pointer"
										>
											Get Started Free
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
