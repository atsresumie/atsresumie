import { motion } from "framer-motion";
import Image from "next/image";

const footerLinks = [
	{ label: "Privacy", href: "#" },
	{ label: "Terms", href: "#" },
	{ label: "Contact", href: "#" },
];

export const Footer = () => {
	return (
		<footer className="relative py-12 border-t border-border/50">
			<div className="container mx-auto">
				<div className="flex flex-col md:flex-row items-center justify-between gap-6">
					{/* Logo */}
					<motion.a
						href="#"
						className="flex items-center gap-2 font-display text-lg font-semibold text-foreground"
						whileHover={{ scale: 1.02 }}
					>
						<Image
							src="/logo.png"
							alt="atsresumie logo"
							width={48}
							height={48}
							className="w-12 h-12"
						/>
						atsresumie
					</motion.a>

					{/* Links */}
					<nav className="flex items-center gap-8">
						{footerLinks.map((link) => (
							<motion.a
								key={link.label}
								href={link.href}
								className="text-sm text-muted-foreground hover:text-foreground transition-colors"
								whileHover={{ y: -1 }}
							>
								{link.label}
							</motion.a>
						))}
					</nav>

					{/* Copyright */}
					<p className="text-sm text-muted-foreground">
						© {new Date().getFullYear()} atsresumie
					</p>
				</div>
			</div>
		</footer>
	);
};
