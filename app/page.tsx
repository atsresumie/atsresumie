"use client";
import { AuthModalProvider } from "@/contexts/AuthModalContext";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { TrustBar } from "@/components/landing/TrustBar";
import { Problem } from "@/components/landing/Problem";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { BeforeAfter } from "@/components/landing/BeforeAfter";
import { Features } from "@/components/landing/Features";
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
					<TrustBar />
					<Problem />
					<HowItWorks />
					<BeforeAfter />
					<Features />
					<Pricing />
					<FAQ />
					<CTA />
				</main>
				<Footer />
			</div>
		</AuthModalProvider>
	);
}
