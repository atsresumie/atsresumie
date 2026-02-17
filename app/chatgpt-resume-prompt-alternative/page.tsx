import { Metadata } from "next";
import { Schema } from "@/components/content/Schema";
import { ContentPageLayout } from "@/components/content/ContentPageLayout";
import {
	CHATGPT_ALTERNATIVE_SECTIONS,
	SHARED_FAQS,
} from "@/components/content/contentPages";

export const metadata: Metadata = {
	title: "A Better Way Than Generic Resume Prompts | ATSResumie",
	description:
		"Generic AI chat prompts can produce inconsistent, inaccurate resume rewrites. ATSResumie is a purpose-built workflow designed to tailor your resume to a job description reliably.",
};

const altFaqs = [
	{
		question: "Can't I just write a better prompt?",
		answer: "You can, and sometimes it works. But a purpose-built tool handles keyword matching, formatting, and fact-grounding automatically — without prompt engineering for every application.",
	},
	{
		question: "Is ATSResumie just a wrapper around ChatGPT?",
		answer: "No. ATSResumie uses its own AI pipeline with custom instructions designed specifically for resume tailoring. The system is built to preserve your real experience and match it to the job description.",
	},
	...SHARED_FAQS.slice(0, 3),
];

const faqSchema = {
	"@context": "https://schema.org",
	"@type": "FAQPage",
	mainEntity: altFaqs.map((faq) => ({
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

export default function ChatGPTAlternativePage() {
	return (
		<>
			<Schema data={[faqSchema, orgSchema, appSchema]} />
			<ContentPageLayout
				title="A better way than generic resume prompts"
				subtitle="Generic chat prompts can miss keywords, drift in formatting, and invent experience. ATSResumie is a purpose-built workflow for tailoring your resume to a job description."
				sections={CHATGPT_ALTERNATIVE_SECTIONS}
			/>
		</>
	);
}
