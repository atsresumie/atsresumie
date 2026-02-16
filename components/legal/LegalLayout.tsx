"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import type { LegalSection } from "./legalContent";

interface LegalLayoutProps {
	title: string;
	subtitle: string;
	lastUpdated: string;
	sections: LegalSection[];
}

export function LegalLayout({
	title,
	subtitle,
	lastUpdated,
	sections,
}: LegalLayoutProps) {
	const [activeId, setActiveId] = useState<string>(sections[0]?.id ?? "");
	const observerRef = useRef<IntersectionObserver | null>(null);

	/* ── IntersectionObserver for active TOC highlighting ── */
	useEffect(() => {
		observerRef.current = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						setActiveId(entry.target.id);
					}
				}
			},
			{
				rootMargin: "-96px 0px -60% 0px", // offset for sticky header
				threshold: 0,
			},
		);

		const elements = sections
			.map((s) => document.getElementById(s.id))
			.filter(Boolean) as HTMLElement[];

		elements.forEach((el) => observerRef.current?.observe(el));

		return () => observerRef.current?.disconnect();
	}, [sections]);

	const handleTocClick = useCallback((id: string) => {
		setActiveId(id);
		const el = document.getElementById(id);
		el?.scrollIntoView({ behavior: "smooth" });
	}, []);

	return (
		<div className="relative min-h-screen bg-background">
			{/* ── Minimal Navbar ── */}
			<nav className="sticky top-0 z-50 border-b border-border-subtle bg-surface-base/95 backdrop-blur-md">
				<div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
					<Link
						href="/"
						className="flex items-center gap-2 font-display text-lg font-semibold text-text-primary no-underline hover:text-accent transition-colors"
					>
						<Image
							src="/logo3.png"
							alt="atsresumie logo"
							width={32}
							height={32}
							className="w-8 h-8"
						/>
						atsresumie
					</Link>
					<Link
						href="/"
						className="text-sm text-text-secondary no-underline hover:text-text-primary transition-colors"
					>
						← Back to home
					</Link>
				</div>
			</nav>

			{/* ── Header ── */}
			<header className="border-b border-border-subtle">
				<div className="container mx-auto px-4 md:px-6 py-12 md:py-16">
					<h1 className="text-3xl md:text-4xl font-display font-semibold text-text-primary mb-3">
						{title}
					</h1>
					<p className="text-base md:text-lg text-text-secondary max-w-2xl mb-4">
						{subtitle}
					</p>
					<p className="text-sm text-text-tertiary">
						Last updated: {lastUpdated}
					</p>
				</div>
			</header>

			{/* ── Mobile TOC (Accordion) ── */}
			<div className="lg:hidden border-b border-border-subtle">
				<div className="container mx-auto px-4 md:px-6">
					<Accordion type="single" collapsible>
						<AccordionItem value="toc" className="border-b-0">
							<AccordionTrigger className="py-4 text-sm font-medium text-text-secondary hover:text-text-primary hover:no-underline">
								<span className="flex items-center gap-2">
									Jump to section
								</span>
							</AccordionTrigger>
							<AccordionContent>
								<nav className="flex flex-col gap-1 pb-2">
									{sections.map((section, i) => (
										<button
											key={section.id}
											onClick={() =>
												handleTocClick(section.id)
											}
											className={`text-left text-sm py-1.5 px-3 rounded transition-colors ${
												activeId === section.id
													? "text-accent bg-accent-muted"
													: "text-text-secondary hover:text-text-primary"
											}`}
										>
											<span className="text-text-tertiary mr-2 text-xs tabular-nums">
												{String(i + 1).padStart(2, "0")}
											</span>
											{section.title}
										</button>
									))}
								</nav>
							</AccordionContent>
						</AccordionItem>
					</Accordion>
				</div>
			</div>

			{/* ── Body: Desktop two-column / Mobile single column ── */}
			<div className="container mx-auto px-4 md:px-6 py-8 md:py-12">
				<div className="flex gap-12 lg:gap-16">
					{/* ── Desktop TOC (sticky sidebar) ── */}
					<aside className="hidden lg:block w-56 shrink-0">
						<nav className="sticky top-24">
							<p className="text-xs font-medium uppercase tracking-wide text-text-tertiary mb-4">
								On this page
							</p>
							<ul className="flex flex-col gap-0.5">
								{sections.map((section, i) => (
									<li key={section.id}>
										<button
											onClick={() =>
												handleTocClick(section.id)
											}
											className={`w-full text-left text-sm py-1.5 px-3 rounded transition-colors focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 ${
												activeId === section.id
													? "text-accent bg-accent-muted font-medium"
													: "text-text-secondary hover:text-text-primary hover:bg-surface-raised"
											}`}
										>
											<span className="text-text-tertiary mr-2 text-xs tabular-nums">
												{String(i + 1).padStart(2, "0")}
											</span>
											{section.title}
										</button>
									</li>
								))}
							</ul>
						</nav>
					</aside>

					{/* ── Content ── */}
					<article className="min-w-0 flex-1 max-w-3xl">
						{sections.map((section, i) => (
							<section
								key={section.id}
								id={section.id}
								className="scroll-mt-24"
							>
								{i > 0 && (
									<hr className="border-border-subtle my-8 md:my-10" />
								)}
								<h2 className="text-xl md:text-2xl font-display font-semibold text-text-primary mb-4">
									{section.title}
								</h2>
								<div className="legal-prose text-text-secondary text-[0.9375rem] leading-relaxed space-y-4">
									{section.content}
								</div>
							</section>
						))}
					</article>
				</div>
			</div>

			{/* ── Footer ── */}
			<footer className="border-t border-border-subtle py-8">
				<div className="container mx-auto px-4 md:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
					<p className="text-sm text-text-tertiary">
						© {new Date().getFullYear()} atsresumie
					</p>
					<div className="flex items-center gap-6 text-sm text-text-secondary">
						<Link
							href="/terms"
							className="no-underline hover:text-text-primary transition-colors"
						>
							Terms
						</Link>
						<Link
							href="/privacy"
							className="no-underline hover:text-text-primary transition-colors"
						>
							Privacy
						</Link>
						<a
							href="mailto:info@atsresumie.com"
							className="no-underline hover:text-text-primary transition-colors"
						>
							Contact
						</a>
					</div>
				</div>
			</footer>
		</div>
	);
}
