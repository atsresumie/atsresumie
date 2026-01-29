"use client";

import { useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Menu, X, LogOut } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import AuthModal from "@/components/auth/AuthModal";
import { HeaderAuthControls } from "./HeaderAuthControls";

const navLinks = [
	{ label: "Pricing", href: "#pricing" },
	{ label: "How it works", href: "#how-it-works" },
	{ label: "FAQ", href: "#faq" },
];

export const Navbar = () => {
	const [isOpen, setIsOpen] = useState(false);
	const [showAuthModal, setShowAuthModal] = useState(false);
	const [authModalTab, setAuthModalTab] = useState<"signin" | "signup">(
		"signin",
	);
	const { user, isAuthenticated, isLoading, signOut } = useAuth();

	const { scrollY } = useScroll();
	const backgroundColor = useTransform(
		scrollY,
		[0, 100],
		["hsla(24, 28%, 12%, 0)", "hsla(24, 28%, 12%, 0.95)"],
	);
	const backdropBlur = useTransform(
		scrollY,
		[0, 100],
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

	const openSignIn = () => {
		setAuthModalTab("signin");
		setShowAuthModal(true);
		setIsOpen(false);
	};

	const openSignUp = () => {
		setAuthModalTab("signup");
		setShowAuthModal(true);
		setIsOpen(false);
	};

	const handleSignOut = async () => {
		await signOut();
		setIsOpen(false);
	};

	return (
		<>
			<motion.nav
				style={{ backgroundColor, backdropFilter: backdropBlur }}
				className="fixed top-0 left-0 right-0 z-50 border-b border-border/50"
			>
				<div className="container mx-auto">
					<div className="flex items-center justify-between h-16 md:h-20">
						{/* Logo */}
						<motion.a
							href="#"
							className="font-display text-xl md:text-2xl font-semibold text-foreground"
							whileHover={{ scale: 1.02 }}
							whileTap={{ scale: 0.98 }}
						>
							atsresumie
						</motion.a>

						{/* Desktop Navigation */}
						<div className="hidden md:flex items-center gap-6">
							{navLinks.map((link) => (
								<motion.button
									key={link.label}
									onClick={() => scrollToSection(link.href)}
									className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
									whileHover={{ y: -1 }}
									whileTap={{ y: 0 }}
								>
									{link.label}
								</motion.button>
							))}

							{/* Auth Controls */}
							<HeaderAuthControls
								onOpenAuthModal={(tab) => {
									setAuthModalTab(tab);
									setShowAuthModal(true);
								}}
							/>
						</div>

						{/* Mobile Menu Button */}
						<motion.button
							onClick={() => setIsOpen(!isOpen)}
							className="md:hidden p-2 text-foreground"
							whileTap={{ scale: 0.95 }}
						>
							{isOpen ? <X size={24} /> : <Menu size={24} />}
						</motion.button>
					</div>
				</div>
			</motion.nav>

			{/* Mobile Menu */}
			<motion.div
				initial={false}
				animate={
					isOpen ? { opacity: 1, x: 0 } : { opacity: 0, x: "100%" }
				}
				transition={{ type: "spring", damping: 25, stiffness: 200 }}
				className="fixed inset-0 z-40 md:hidden bg-background/98 backdrop-blur-xl"
				style={{ pointerEvents: isOpen ? "auto" : "none" }}
			>
				<div className="flex flex-col items-center justify-center h-full gap-6">
					{navLinks.map((link, i) => (
						<motion.button
							key={link.label}
							onClick={() => scrollToSection(link.href)}
							className="text-2xl font-display font-medium text-foreground"
							initial={{ opacity: 0, y: 20 }}
							animate={
								isOpen
									? {
											opacity: 1,
											y: 0,
											transition: { delay: i * 0.1 },
										}
									: { opacity: 0, y: 20 }
							}
						>
							{link.label}
						</motion.button>
					))}

					{/* Mobile Auth Buttons */}
					{!isLoading && (
						<>
							{isAuthenticated ? (
								<motion.button
									onClick={handleSignOut}
									className="flex items-center gap-2 text-lg text-muted-foreground"
									initial={{ opacity: 0, y: 20 }}
									animate={
										isOpen
											? {
													opacity: 1,
													y: 0,
													transition: { delay: 0.3 },
												}
											: { opacity: 0, y: 20 }
									}
								>
									<LogOut size={20} />
									Sign out ({user?.email?.split("@")[0]})
								</motion.button>
							) : (
								<>
									<motion.button
										onClick={openSignIn}
										className="text-lg text-muted-foreground"
										initial={{ opacity: 0, y: 20 }}
										animate={
											isOpen
												? {
														opacity: 1,
														y: 0,
														transition: {
															delay: 0.3,
														},
													}
												: { opacity: 0, y: 20 }
										}
									>
										Sign in
									</motion.button>
									<motion.button
										onClick={openSignUp}
										className="px-6 py-3 bg-[rgba(233,221,199,0.1)] text-foreground font-medium text-lg rounded-xl border border-[rgba(233,221,199,0.15)]"
										initial={{ opacity: 0, y: 20 }}
										animate={
											isOpen
												? {
														opacity: 1,
														y: 0,
														transition: {
															delay: 0.35,
														},
													}
												: { opacity: 0, y: 20 }
										}
									>
										Sign up
									</motion.button>
								</>
							)}
						</>
					)}

					<motion.button
						onClick={() => scrollToSection("#start")}
						className="mt-4 px-8 py-4 bg-secondary text-secondary-foreground font-medium text-lg rounded-xl"
						initial={{ opacity: 0, y: 20 }}
						animate={
							isOpen
								? {
										opacity: 1,
										y: 0,
										transition: { delay: 0.4 },
									}
								: { opacity: 0, y: 20 }
						}
					>
						Get Started
					</motion.button>
				</div>
			</motion.div>

			{/* Auth Modal */}
			<AuthModal
				open={showAuthModal}
				onClose={() => setShowAuthModal(false)}
				defaultTab={authModalTab}
			/>
		</>
	);
};
