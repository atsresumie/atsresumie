import Image from "next/image";
import Link from "next/link";

const footerLinks = [
	{ label: "Privacy", href: "#" },
	{ label: "Terms", href: "#" },
	{ label: "Contact", href: "#" },
];

export const Footer = () => {
	return (
		<footer className="relative py-12 border-t border-border-subtle">
			<div className="container mx-auto">
				<div className="flex flex-col md:flex-row items-center justify-between gap-6">
					{/* Logo */}
					<Link
						href="/"
						className="flex items-center gap-2 font-display text-lg font-semibold text-text-primary hover:text-accent transition-colors"
					>
						<Image
							src="/logo3.png"
							alt="atsresumie logo"
							width={40}
							height={40}
							className="w-12 h-12"
						/>
						atsresumie
					</Link>

					{/* Links */}
					<nav className="flex items-center gap-8">
						{footerLinks.map((link) => (
							<a
								key={link.label}
								href={link.href}
								className="text-sm text-text-secondary hover:text-text-primary transition-colors hover:-translate-y-0.5"
							>
								{link.label}
							</a>
						))}
					</nav>

					{/* Copyright */}
					<p className="text-sm text-text-secondary">
						© {new Date().getFullYear()} atsresumie
					</p>
				</div>
			</div>
		</footer>
	);
};
