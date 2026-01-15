import "./globals.css";
import Providers from "./providers";

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
		<html lang="en" suppressHydrationWarning>
			<body>
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
