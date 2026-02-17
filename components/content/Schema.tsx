/**
 * Schema – renders JSON-LD structured data as a <script> tag.
 * Server component — no client APIs. Use once per page.
 */

interface SchemaProps {
	data: object | object[];
}

export function Schema({ data }: SchemaProps) {
	const jsonLd = Array.isArray(data) ? data : [data];

	return (
		<>
			{jsonLd.map((item, i) => (
				<script
					key={i}
					type="application/ld+json"
					dangerouslySetInnerHTML={{
						__html: JSON.stringify(item, null, 0),
					}}
				/>
			))}
		</>
	);
}
