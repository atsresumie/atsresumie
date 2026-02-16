import { Metadata } from "next";
import { LegalLayout } from "@/components/legal/LegalLayout";
import { PRIVACY_SECTIONS } from "@/components/legal/legalContent";

export const metadata: Metadata = {
	title: "Privacy Policy | atsresumie",
	description:
		"Learn how ATSResumie collects, uses, and protects your personal information.",
};

export default function PrivacyPage() {
	return (
		<LegalLayout
			title="Privacy Policy"
			subtitle="How we collect, use, and protect your information."
			lastUpdated="2026-02-16"
			sections={PRIVACY_SECTIONS}
		/>
	);
}
