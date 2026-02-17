import { Metadata } from "next";
import { Schema } from "@/components/content/Schema";
import { ContentPageLayout } from "@/components/content/ContentPageLayout";
import {
	EXAMPLES_SECTIONS,
	SHARED_FAQS,
} from "@/components/content/contentPages";

export const metadata: Metadata = {
	title: "Resume Tailoring Examples | ATSResumie",
	description:
		"See real before-and-after examples of how ATSResumie tailors your resume to a job description. Keyword alignment, skills restructuring, and more.",
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

export default function ExamplesPage() {
	return (
		<>
			<Schema data={[faqSchema, orgSchema, appSchema]} />
			<ContentPageLayout
				title="Resume tailoring examples"
				subtitle="See how ATSResumie rewrites and restructures real resume content to match job descriptions — without inventing anything."
				sections={EXAMPLES_SECTIONS}
			/>
		</>
	);
}
