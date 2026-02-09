import "./globals.css";
import Providers from "./providers";
import { Manrope, DM_Sans } from "next/font/google";

const displayFont = Manrope({
	subsets: ["latin"],
	weight: ["400", "500", "600", "700"],
	variable: "--font-display",
	display: "swap",
});

const bodyFont = DM_Sans({
	subsets: ["latin"],
	weight: ["400", "500", "600", "700"],
	style: ["normal", "italic"],
	variable: "--font-body",
	display: "swap",
});

export { displayFont, bodyFont };

export const jsonLd = {
	"@context": "https://schema.org",
	"@type": "SoftwareApplication",
	name: "atsresumie",
	applicationCategory: "BusinessApplication",
	description: "Generate ATS-optimized resumes as LaTeX and export PDF.",
	offers: {
		"@type": "Offer",
		price: "0",
		priceCurrency: "USD",
	},
};

export const metadata = {
	title: "atsresumie – ATS-Optimized Resume Generator",
	description:
		"Generate ATS-optimized resumes as LaTeX. Paste your job description and resume, get a professional PDF in minutes. 3 free credits included.",
	authors: [{ name: "atsresumie" }],
	alternates: { canonical: "https://atsresumie.com" },
	openGraph: {
		title: "atsresumie – ATS-Optimized Resume Generator",
		description:
			"Generate ATS-optimized resumes as LaTeX. Paste your job description and resume, get a professional PDF in minutes.",
		url: "https://atsresumie.com",
		siteName: "atsresumie",
		type: "website",
	},
	twitter: {
		card: "summary_large_image",
		site: "@atsresumie",
	},
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html
			lang="en"
			suppressHydrationWarning
			className={`${displayFont.variable} ${bodyFont.variable}`}
		>
			<body className="antialiased font-body">
				<a
					href="#main-content"
					className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-surface-raised focus:text-text-primary"
				>
					Skip to content
				</a>
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
