import { Metadata } from "next";
import { Schema } from "@/components/content/Schema";
import { ContentPageLayout } from "@/components/content/ContentPageLayout";
import {
	HOW_IT_WORKS_SECTIONS,
	SHARED_FAQS,
} from "@/components/content/contentPages";

export const metadata: Metadata = {
	title: "How ATSResumie Works | ATSResumie",
	description:
		"Learn how ATSResumie helps you tailor your resume to a job description in three simple steps. Upload, paste, generate — no fabricated experience.",
};

const faqSchema = {
	"@context": "https://schema.org",
	"@type": "FAQPage",
	mainEntity: SHARED_FAQS.map((faq) => ({
		"@type": "Question",
		name: faq.question,
		acceptedAnswer: {
			"@type": "Answer",
			text: faq.answer,
		},
	})),
};

const orgSchema = {
	"@context": "https://schema.org",
	"@type": "Organization",
	name: "ATSResumie",
	url: "https://atsresumie.com",
	contactPoint: {
		"@type": "ContactPoint",
		email: "info@atsresumie.com",
		contactType: "customer support",
	},
};

const appSchema = {
	"@context": "https://schema.org",
	"@type": "SoftwareApplication",
	name: "ATSResumie",
	applicationCategory: "BusinessApplication",
	operatingSystem: "Web",
	description:
		"ATS-friendly resume tailoring from your resume and a job description.",
	offers: {
		"@type": "AggregateOffer",
		priceCurrency: "USD",
		lowPrice: "0",
		offerCount: "3",
		offers: [
			{
				"@type": "Offer",
				price: "0",
				priceCurrency: "USD",
				description: "Free tier with starter credits",
			},
			{
				"@type": "Offer",
				priceCurrency: "USD",
				description: "Subscription plans available",
			},
		],
	},
};

export default function HowItWorksPage() {
	return (
		<>
			<Schema data={[faqSchema, orgSchema, appSchema]} />
			<ContentPageLayout
				title="How ATSResumie works"
				subtitle="Upload your resume, paste a job description, and get a tailored version in seconds. No fabricated experience — ever."
				sections={HOW_IT_WORKS_SECTIONS}
			/>
		</>
	);
}
