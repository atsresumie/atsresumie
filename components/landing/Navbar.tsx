import { useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Menu, X } from "lucide-react";
import Link from "next/link";

const navLinks = [
	{ label: "Pricing", href: "#pricing" },
	{ label: "How it works", href: "#how-it-works" },
	{ label: "FAQ", href: "#faq" },
];

export const Navbar = () => {
	const [isOpen, setIsOpen] = useState(false);
	const { scrollY } = useScroll();
	const backgroundColor = useTransform(
		scrollY,
		[0, 100],
		["hsla(24, 28%, 12%, 0)", "hsla(24, 28%, 12%, 0.95)"]
	);
	const backdropBlur = useTransform(
		scrollY,
		[0, 100],
		["blur(0px)", "blur(12px)"]
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
						<div className="hidden md:flex items-center gap-8">
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
							<motion.button
								onClick={() => scrollToSection("#start")}
								className="px-5 py-2.5 bg-secondary text-secondary-foreground font-medium text-sm rounded-xl shadow-soft hover:shadow-glow transition-all"
								whileHover={{ scale: 1.02, y: -1 }}
								whileTap={{ scale: 0.98 }}
							>
								<Link href="/get-started">Get Started</Link>
							</motion.button>
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
				<div className="flex flex-col items-center justify-center h-full gap-8">
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
					<motion.button
						onClick={() => scrollToSection("#start")}
						className="mt-4 px-8 py-4 bg-secondary text-secondary-foreground font-medium text-lg rounded-xl"
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
						Get Started
					</motion.button>
				</div>
			</motion.div>
		</>
	);
};
