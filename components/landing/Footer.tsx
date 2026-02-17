import Image from "next/image";
import Link from "next/link";

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
					<nav className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
						<Link
							href="/how-it-works"
							className="text-sm text-text-secondary hover:text-text-primary transition-colors hover:-translate-y-0.5"
						>
							How it works
						</Link>
						<Link
							href="/examples"
							className="text-sm text-text-secondary hover:text-text-primary transition-colors hover:-translate-y-0.5"
						>
							Examples
						</Link>
						<Link
							href="/resume-tailor-job-description"
							className="text-sm text-text-secondary hover:text-text-primary transition-colors hover:-translate-y-0.5"
						>
							Tailor to JD
						</Link>
						<Link
							href="/privacy"
							className="text-sm text-text-secondary hover:text-text-primary transition-colors hover:-translate-y-0.5"
						>
							Privacy Policy
						</Link>
						<Link
							href="/terms"
							className="text-sm text-text-secondary hover:text-text-primary transition-colors hover:-translate-y-0.5"
						>
							Terms of Service
						</Link>
						<a
							href="mailto:info@atsresumie.com"
							className="text-sm text-text-secondary hover:text-text-primary transition-colors hover:-translate-y-0.5"
						>
							Contact Us
						</a>
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
