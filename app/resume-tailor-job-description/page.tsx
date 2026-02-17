import { Metadata } from "next";
import { Schema } from "@/components/content/Schema";
import { ContentPageLayout } from "@/components/content/ContentPageLayout";
import {
	TAILOR_TO_JD_SECTIONS,
	SHARED_FAQS,
} from "@/components/content/contentPages";

export const metadata: Metadata = {
	title: "Tailor Your Resume to a Job Description | ATSResumie",
	description:
		"Learn why tailoring your resume to each job description matters for ATS screening, and how ATSResumie helps you do it faster without keyword stuffing or fabrication.",
};

const tailoringFaqs = [
	{
		question: "How is this different from a template?",
		answer: "Templates give you formatting. ATSResumie rewrites your content to match the specific job description you're targeting — formatting and content.",
	},
	{
		question: "Does tailoring really make a difference?",
		answer: "Yes. Resumes tailored to the job description typically score higher in ATS keyword matching and tend to get more attention from recruiters.",
	},
	...SHARED_FAQS.slice(0, 3),
];

const faqSchema = {
	"@context": "https://schema.org",
	"@type": "FAQPage",
	mainEntity: tailoringFaqs.map((faq) => ({
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

export default function TailorToJDPage() {
	return (
		<>
			<Schema data={[faqSchema, orgSchema, appSchema]} />
			<ContentPageLayout
				title="Tailor your resume to a job description"
				subtitle="ATS systems filter resumes by keywords. Learn how tailoring your resume to each job description helps you get past the screen — and how ATSResumie makes it faster."
				sections={TAILOR_TO_JD_SECTIONS}
			/>
		</>
	);
}
