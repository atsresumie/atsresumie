import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
	const baseUrl = "https://atsresumie.vercel.app";

	return [
		{ url: `${baseUrl}/`, lastModified: new Date() },
		// Add real pages as you create them:
		// { url: `${baseUrl}/pricing`, lastModified: new Date() },
		// { url: `${baseUrl}/privacy`, lastModified: new Date() },
		// { url: `${baseUrl}/terms`, lastModified: new Date() },
	];
}
