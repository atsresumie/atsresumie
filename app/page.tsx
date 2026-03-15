"use client";
import { AuthModalProvider } from "@/contexts/AuthModalContext";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { TrustBar } from "@/components/landing/TrustBar";
import { Problem } from "@/components/landing/Problem";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Features } from "@/components/landing/Features";
import { BeforeAfter } from "@/components/landing/BeforeAfter";
import { PlatformPreview } from "@/components/landing/PlatformPreview";
import { JobTracker } from "@/components/landing/JobTracker";
import { ATSScore } from "@/components/landing/ATSScore";
import { JobDiscovery } from "@/components/landing/JobDiscovery";
import { TemplateSelector } from "@/components/landing/TemplateSelector";
import { Pricing } from "@/components/landing/Pricing";
import { FAQ } from "@/components/landing/FAQ";
import { CTA } from "@/components/landing/CTA";
import { Footer } from "@/components/landing/Footer";

export default function Home() {
	return (
		<AuthModalProvider>
			<div className="landing relative min-h-screen bg-background">
				<Navbar />
				<main>
					{/* Core product story */}
					<Hero />
					<TrustBar />

					<HowItWorks />
					<Features />
					<BeforeAfter />

					{/* Platform direction – broader workflow */}
					<PlatformPreview />
					<JobTracker />

					{/* ATS Score + Job Discovery — side-by-side on desktop */}
					<section className="py-20 md:py-28">
						<div className="container mx-auto px-4">
							<div className="text-center mb-12">
								<span className="inline-block px-3 py-1 mb-4 text-[11px] font-semibold uppercase tracking-wider rounded-full bg-accent-muted text-accent border border-accent/15">
									Platform direction
								</span>
								<h2 className="font-display text-2xl md:text-3xl font-semibold">
									More than a resume generator
								</h2>
							</div>
							<div className="grid md:grid-cols-2 gap-5 max-w-5xl mx-auto">
								<ATSScore />
								<JobDiscovery />
							</div>
						</div>
					</section>

					<TemplateSelector />

					{/* Conversion */}
					<Pricing />
					<FAQ />
					<CTA />
				</main>
				<Footer />
			</div>
		</AuthModalProvider>
	);
}
