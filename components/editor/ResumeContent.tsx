"use client";

import type { RenderPayload, EditorSettings } from "@/types/editor";
import "@/styles/latex-resume.css";

interface ResumeContentProps {
	payload: RenderPayload;
	settings: EditorSettings;
}

/**
 * Renders the structured resume content with LaTeX-matching styling
 */
export function ResumeContent({ payload }: ResumeContentProps) {
	return (
		<div className="latex-resume">
			{/* Header: Name + Contacts */}
			<header>
				<h1 className="resume-name">{payload.title.name}</h1>
				{payload.title.subtitle && (
					<p className="resume-contacts">{payload.title.subtitle}</p>
				)}
				{payload.title.contacts.length > 0 && (
					<p className="resume-contacts">
						{payload.title.contacts.map((contact, idx) => (
							<span key={idx}>
								{idx > 0 && " • "}
								{contact.includes("@") ? (
									<a href={`mailto:${contact}`}>{contact}</a>
								) : contact.includes("linkedin") ||
								  contact.includes("github") ? (
									<a
										href={`https://${contact}`}
										target="_blank"
										rel="noopener noreferrer"
									>
										{contact}
									</a>
								) : (
									contact
								)}
							</span>
						))}
					</p>
				)}
			</header>

			{/* Sections */}
			{payload.sections.map((section) => (
				<section key={section.id} className="resume-section">
					<h2 className="section-heading">{section.heading}</h2>

					{section.items.map((item, idx) => {
						if (item.type === "bullets") {
							return (
								<div key={idx} className="resume-entry">
									{/* Entry header if present */}
									{item.title && (
										<div className="entry-header">
											<span className="entry-title">
												{item.title}
											</span>
											{item.meta && (
												<span className="entry-meta">
													{item.meta}
												</span>
											)}
										</div>
									)}
									{item.subtitle && (
										<div className="entry-subtitle">
											{item.subtitle}
										</div>
									)}

									{/* Bullets */}
									{item.bullets.length > 0 && (
										<ul className="bullet-list">
											{item.bullets.map(
												(bullet, bIdx) => (
													<li key={bIdx}>{bullet}</li>
												),
											)}
										</ul>
									)}
								</div>
							);
						}

						// Paragraph
						return (
							<p key={idx} className="resume-paragraph">
								{item.text}
							</p>
						);
					})}
				</section>
			))}
		</div>
	);
}
