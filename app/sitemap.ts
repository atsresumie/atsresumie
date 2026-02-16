import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
	const baseUrl = "https://atsresumie.com";

	return [
		{ url: `${baseUrl}/`, lastModified: new Date() },
		{ url: `${baseUrl}/get-started`, lastModified: new Date() },
		// Uncomment as you create these pages:
		// { url: `${baseUrl}/pricing`, lastModified: new Date() },
		// { url: `${baseUrl}/privacy`, lastModified: new Date() },
		// { url: `${baseUrl}/terms`, lastModified: new Date() },
	];
}
