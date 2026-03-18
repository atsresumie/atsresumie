"use client";
import { AuthModalProvider } from "@/contexts/AuthModalContext";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { BeforeAfter } from "@/components/landing/BeforeAfter";
import { Problem } from "@/components/landing/Problem";
import { JobTracker } from "@/components/landing/JobTracker";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { TemplateSelector } from "@/components/landing/TemplateSelector";
import { Features } from "@/components/landing/Features";
import { Pricing } from "@/components/landing/Pricing";
import { FAQ } from "@/components/landing/FAQ";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
	return (
		<AuthModalProvider>
			<div className="landing relative min-h-screen bg-background">
				<Navbar />
				<main className="pt-16 md:pt-[72px]">
					<Hero />
					<BeforeAfter />
					<Problem />
					<JobTracker />
					<HowItWorks />
					<TemplateSelector />
					<Features />
					<Pricing />
					<FAQ />
				</main>
				<Footer />
			</div>
		</AuthModalProvider>
	);
}
