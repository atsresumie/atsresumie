import { Metadata } from "next";
import { LegalLayout } from "@/components/legal/LegalLayout";
import { TERMS_SECTIONS } from "@/components/legal/legalContent";

export const metadata: Metadata = {
	title: "Terms of Service | atsresumie",
	description:
		"Read the Terms of Service for ATSResumie, the AI-powered resume tailoring platform.",
};

export default function TermsPage() {
	return (
		<LegalLayout
			title="Terms of Service"
			subtitle="Please read these terms carefully before using ATSResumie."
			lastUpdated="2026-02-16"
			sections={TERMS_SECTIONS}
		/>
	);
}
