"use client";
import { AuthModalProvider } from "@/contexts/AuthModalContext";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Features } from "@/components/landing/Features";
import { BeforeAfter } from "@/components/landing/BeforeAfter";
import { Pricing } from "@/components/landing/Pricing";
import { FAQ } from "@/components/landing/FAQ";
import { CTA } from "@/components/landing/CTA";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
	return (
		<AuthModalProvider>
			<div className="relative min-h-screen bg-background">
				<Navbar />
				<main>
					<Hero />
					<HowItWorks />
					<Features />
					<BeforeAfter />
					<Pricing />
					<FAQ />
					<CTA />
				</main>
				<Footer />
			</div>
		</AuthModalProvider>
	);
}
