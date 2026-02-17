import React from "react";
import Link from "next/link";

/* ── Shared types ── */

export interface ContentSection {
	id: string;
	title: string;
	content: React.ReactNode;
}

/* ── Inline CTA helper ── */

function InlineCTA() {
	return (
		<div className="my-8 flex items-center gap-4">
			<Link
				href="/get-started"
				className="inline-flex items-center gap-2 rounded bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground no-underline transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
			>
				Tailor my resume →
			</Link>
		</div>
	);
}

/* ── Shared FAQ schema helper ── */

export const SHARED_FAQS = [
	{
		question: "Will ATSResumie invent experience I don't have?",
		answer: "No. ATSResumie rewrites what you already have. It won't fabricate roles, skills, or claims. Every bullet is grounded in your original resume content.",
	},
	{
		question: "Is the output ATS compliant?",
		answer: "Yes. ATSResumie outputs clean, ATS-readable formatting designed to pass the automated screening systems most employers use.",
	},
	{
		question: "What file types can I upload?",
		answer: "PDF and DOCX. Upload your existing resume in either format and ATSResumie will parse it automatically.",
	},
	{
		question: "Can I tailor my resume for multiple jobs?",
		answer: "Absolutely. You can generate and save multiple tailored versions of your resume — one for each role you're applying to.",
	},
	{
		question: "Do I need an account?",
		answer: "You can preview the experience without an account, but you'll need to sign up (free) to generate and download tailored resumes. You get 3 free credits on signup.",
	},
];

/* ============================================================================
   /how-it-works
   ============================================================================ */

export const HOW_IT_WORKS_SECTIONS: ContentSection[] = [
	{
		id: "upload-resume",
		title: "1. Upload your resume",
		content: (
			<>
				<p>
					Start by uploading the resume you already have. ATSResumie
					accepts <strong>PDF</strong> and <strong>DOCX</strong>{" "}
					formats — no copy-pasting from scratch.
				</p>
				<p>
					Your resume is parsed instantly so the AI can understand
					your experience, skills, and career history exactly as you
					wrote them.
				</p>
			</>
		),
	},
	{
		id: "paste-job-description",
		title: "2. Paste the job description",
		content: (
			<>
				<p>
					Copy the job posting you&apos;re applying to and paste it
					into ATSResumie. The AI reads the description to identify:
				</p>
				<ul>
					<li>Required and preferred skills</li>
					<li>Key responsibilities and expectations</li>
					<li>Industry-specific terminology the ATS will scan for</li>
				</ul>
				<p>
					This is how your resume gets tailored to the specific role —
					not a generic rewrite, but a targeted one.
				</p>
			</>
		),
	},
	{
		id: "generate-review-download",
		title: "3. Generate, review, and download",
		content: (
			<>
				<p>
					ATSResumie generates a tailored version of your resume in
					seconds. Before you download, you can:
				</p>
				<ul>
					<li>
						<strong>Review</strong> every change the AI made
					</li>
					<li>
						<strong>Edit</strong> sections in the built-in editor
					</li>
					<li>
						<strong>Download</strong> a clean, ATS-friendly PDF
						ready to submit
					</li>
				</ul>
				<p>
					You stay in control of the final output — nothing gets sent
					without your approval.
				</p>
				<InlineCTA />
			</>
		),
	},
	{
		id: "truth-first",
		title: "Truth-first approach",
		content: (
			<>
				<p>
					ATSResumie is built around a simple principle:{" "}
					<strong>
						your resume should be an accurate representation of your
						experience
					</strong>
					.
				</p>
				<p>The AI will never:</p>
				<ul>
					<li>Fabricate job titles, companies, or dates</li>
					<li>Invent skills or certifications you don&apos;t have</li>
					<li>
						Add accomplishments that aren&apos;t in your original
						resume
					</li>
				</ul>
				<p>
					What it <em>will</em> do is rephrase and restructure your
					real experience so it aligns with the language of the job
					description — helping you get past ATS filters without
					misrepresenting yourself.
				</p>
			</>
		),
	},
	{
		id: "faq",
		title: "Frequently asked questions",
		content: (
			<>
				{SHARED_FAQS.map((faq) => (
					<div key={faq.question} className="mb-6">
						<h3>{faq.question}</h3>
						<p>{faq.answer}</p>
					</div>
				))}
			</>
		),
	},
];

/* ============================================================================
   /examples
   ============================================================================ */

export const EXAMPLES_SECTIONS: ContentSection[] = [
	{
		id: "before-after",
		title: "Before & after bullet rewrites",
		content: (
			<>
				<p>
					Here are three anonymized examples showing how ATSResumie
					tailors resume bullets to match a job description — without
					changing the facts.
				</p>

				<div className="space-y-6 mt-6">
					{/* Example 1 */}
					<div className="rounded border border-border-subtle overflow-hidden">
						<div className="bg-surface-raised px-4 py-3 text-xs font-medium uppercase tracking-wide text-text-tertiary">
							Software Engineer — Cloud Infrastructure Role
						</div>
						<div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border-subtle">
							<div className="px-4 py-3">
								<p className="text-xs font-medium text-text-tertiary mb-1">
									Before
								</p>
								<p className="text-sm">
									&ldquo;Worked on backend services and helped
									improve system performance.&rdquo;
								</p>
							</div>
							<div className="px-4 py-3">
								<p className="text-xs font-medium text-accent mb-1">
									After
								</p>
								<p className="text-sm">
									&ldquo;Designed and maintained cloud-based
									backend microservices, improving API
									response times by reducing latency through
									query optimization and caching
									strategies.&rdquo;
								</p>
							</div>
						</div>
					</div>

					{/* Example 2 */}
					<div className="rounded border border-border-subtle overflow-hidden">
						<div className="bg-surface-raised px-4 py-3 text-xs font-medium uppercase tracking-wide text-text-tertiary">
							Data Analyst — Business Intelligence Role
						</div>
						<div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border-subtle">
							<div className="px-4 py-3">
								<p className="text-xs font-medium text-text-tertiary mb-1">
									Before
								</p>
								<p className="text-sm">
									&ldquo;Created reports and dashboards for
									the sales team.&rdquo;
								</p>
							</div>
							<div className="px-4 py-3">
								<p className="text-xs font-medium text-accent mb-1">
									After
								</p>
								<p className="text-sm">
									&ldquo;Built automated BI dashboards using
									SQL and Tableau to surface sales KPIs,
									enabling data-driven decision-making across
									regional teams.&rdquo;
								</p>
							</div>
						</div>
					</div>

					{/* Example 3 */}
					<div className="rounded border border-border-subtle overflow-hidden">
						<div className="bg-surface-raised px-4 py-3 text-xs font-medium uppercase tracking-wide text-text-tertiary">
							Customer Support — Team Lead Role
						</div>
						<div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border-subtle">
							<div className="px-4 py-3">
								<p className="text-xs font-medium text-text-tertiary mb-1">
									Before
								</p>
								<p className="text-sm">
									&ldquo;Managed a group of support agents and
									handled escalations.&rdquo;
								</p>
							</div>
							<div className="px-4 py-3">
								<p className="text-xs font-medium text-accent mb-1">
									After
								</p>
								<p className="text-sm">
									&ldquo;Led a team of 8 customer support
									representatives, managing escalation
									workflows and reducing average resolution
									time through process improvements and
									coaching.&rdquo;
								</p>
							</div>
						</div>
					</div>
				</div>

				<InlineCTA />
			</>
		),
	},
	{
		id: "keyword-alignment",
		title: "Keyword alignment in action",
		content: (
			<>
				<p>
					ATS systems scan for specific terms from the job
					description. ATSResumie maps your existing skills to the
					language the employer uses.
				</p>
				<div className="mt-4 rounded border border-border-subtle overflow-hidden">
					<div className="bg-surface-raised px-4 py-3 text-xs font-medium uppercase tracking-wide text-text-tertiary">
						JD keyword → Resume phrasing
					</div>
					<div className="divide-y divide-border-subtle text-sm">
						<div className="grid grid-cols-2 px-4 py-2.5">
							<span className="text-text-secondary">
								&ldquo;cross-functional collaboration&rdquo;
							</span>
							<span>
								&ldquo;Partnered with engineering, design, and
								product teams to…&rdquo;
							</span>
						</div>
						<div className="grid grid-cols-2 px-4 py-2.5">
							<span className="text-text-secondary">
								&ldquo;stakeholder management&rdquo;
							</span>
							<span>
								&ldquo;Communicated project updates to senior
								leadership and external partners…&rdquo;
							</span>
						</div>
						<div className="grid grid-cols-2 px-4 py-2.5">
							<span className="text-text-secondary">
								&ldquo;CI/CD pipelines&rdquo;
							</span>
							<span>
								&ldquo;Configured and maintained CI/CD workflows
								using GitHub Actions…&rdquo;
							</span>
						</div>
						<div className="grid grid-cols-2 px-4 py-2.5">
							<span className="text-text-secondary">
								&ldquo;data-driven insights&rdquo;
							</span>
							<span>
								&ldquo;Analyzed customer behavior data to
								identify trends and inform product…&rdquo;
							</span>
						</div>
					</div>
				</div>
			</>
		),
	},
	{
		id: "skills-structure",
		title: "Skills section restructuring",
		content: (
			<>
				<p>
					ATSResumie can restructure your skills section to group
					relevant abilities together and prioritize the ones the job
					description emphasizes. No skills are invented — only
					reorganized and rephrased.
				</p>
				<div className="mt-4 grid md:grid-cols-2 gap-4">
					<div className="rounded border border-border-subtle bg-surface-raised p-4">
						<p className="text-xs font-medium text-text-tertiary mb-2">
							Before (flat list)
						</p>
						<p className="text-sm text-text-secondary">
							Python, SQL, Excel, Tableau, Communication,
							Teamwork, Problem Solving
						</p>
					</div>
					<div className="rounded border border-border-subtle bg-surface-raised p-4">
						<p className="text-xs font-medium text-accent mb-2">
							After (grouped and targeted)
						</p>
						<div className="text-sm space-y-1">
							<p>
								<strong>Data Analysis:</strong> Python, SQL,
								Tableau, Excel
							</p>
							<p>
								<strong>Collaboration:</strong> Cross-functional
								communication, stakeholder reporting
							</p>
						</div>
					</div>
				</div>
			</>
		),
	},
	{
		id: "role-variations",
		title: "Works across roles and industries",
		content: (
			<>
				<p>
					ATSResumie isn&apos;t limited to a specific field. Because
					it reads the job description directly, it adapts to the
					language and expectations of the role you&apos;re targeting.
					Common roles users tailor for include:
				</p>
				<ul>
					<li>Software Engineer</li>
					<li>Data Analyst</li>
					<li>Sales Associate</li>
					<li>Restaurant Supervisor</li>
					<li>Customer Support Representative</li>
					<li>Marketing Coordinator</li>
					<li>Operations Manager</li>
				</ul>
				<p>
					Whether you&apos;re in tech, hospitality, retail, or finance
					— the same workflow applies: upload, paste, generate.
				</p>
				<InlineCTA />
			</>
		),
	},
	{
		id: "faq",
		title: "Frequently asked questions",
		content: (
			<>
				{SHARED_FAQS.map((faq) => (
					<div key={faq.question} className="mb-6">
						<h3>{faq.question}</h3>
						<p>{faq.answer}</p>
					</div>
				))}
			</>
		),
	},
];

/* ============================================================================
   /resume-tailor-job-description
   ============================================================================ */

export const TAILOR_TO_JD_SECTIONS: ContentSection[] = [
	{
		id: "why-tailoring-matters",
		title: "Why tailoring your resume matters",
		content: (
			<>
				<p>
					Most companies use Applicant Tracking Systems (ATS) to
					filter resumes before a human ever reads them. These systems
					compare your resume against the job description, looking for
					matching keywords, skills, and phrasing.
				</p>
				<p>
					A generic resume — even a well-written one — can get
					filtered out simply because it doesn&apos;t use the same
					language as the posting.
				</p>
				<p>Tailoring your resume to each job description helps you:</p>
				<ul>
					<li>Pass ATS keyword filters</li>
					<li>Show the hiring manager you understand the role</li>
					<li>
						Highlight the most relevant parts of your experience
					</li>
					<li>Stand out without misrepresenting your background</li>
				</ul>
			</>
		),
	},
	{
		id: "how-to-tailor",
		title: "How to tailor a resume (step by step)",
		content: (
			<>
				<p>
					Whether you use ATSResumie or do it manually, here&apos;s
					the core process:
				</p>
				<ol className="list-decimal pl-6 space-y-2">
					<li>
						<strong>Read the job description carefully.</strong>{" "}
						Highlight skills, tools, and responsibilities that
						appear more than once.
					</li>
					<li>
						<strong>Match your experience.</strong> For each key
						requirement, find a bullet on your resume that
						demonstrates that ability.
					</li>
					<li>
						<strong>Rephrase using the JD&apos;s language.</strong>{" "}
						If the posting says &ldquo;cross-functional
						collaboration,&rdquo; use that phrase — not just
						&ldquo;worked with other teams.&rdquo;
					</li>
					<li>
						<strong>Reorder sections.</strong> Put the most relevant
						experience and skills near the top.
					</li>
					<li>
						<strong>Remove irrelevant filler.</strong> Cut bullets
						that don&apos;t contribute to the story for this
						specific role.
					</li>
				</ol>
				<InlineCTA />
			</>
		),
	},
	{
		id: "common-mistakes",
		title: "Common mistakes when tailoring",
		content: (
			<>
				<p>
					Tailoring is important, but it&apos;s easy to get it wrong.
					Watch out for:
				</p>
				<ul>
					<li>
						<strong>Keyword stuffing.</strong> Cramming terms into
						your resume unnaturally can trip ATS spam filters and
						looks bad to recruiters.
					</li>
					<li>
						<strong>
							Copying responsibilities from the job post.
						</strong>{" "}
						Your resume should describe what <em>you did</em>, not
						restate the listing.
					</li>
					<li>
						<strong>Claiming skills you don&apos;t have.</strong>{" "}
						Even if the ATS passes you through, misrepresenting your
						experience will surface in interviews.
					</li>
					<li>
						<strong>
							Using one version for every application.
						</strong>{" "}
						A &ldquo;general&rdquo; resume underperforms a targeted
						one nearly every time.
					</li>
				</ul>
			</>
		),
	},
	{
		id: "how-atsresumie-helps",
		title: "How ATSResumie helps you tailor faster",
		content: (
			<>
				<p>
					ATSResumie is purpose-built for this workflow. Instead of
					manually comparing your resume to each posting, you:
				</p>
				<ol className="list-decimal pl-6 space-y-2">
					<li>Upload your resume (PDF or DOCX)</li>
					<li>Paste the job description</li>
					<li>
						Get a tailored version in seconds — rephrased,
						restructured, and aligned with the role
					</li>
				</ol>
				<p>
					You review every change before downloading. Nothing is
					fabricated. The output is clean, ATS-friendly, and ready to
					submit.
				</p>
				<InlineCTA />
			</>
		),
	},
	{
		id: "faq",
		title: "Frequently asked questions",
		content: (
			<>
				<div className="mb-6">
					<h3>How is this different from a template?</h3>
					<p>
						Templates give you formatting. ATSResumie rewrites your
						content to match the specific job description
						you&apos;re targeting — formatting and content.
					</p>
				</div>
				<div className="mb-6">
					<h3>Does tailoring really make a difference?</h3>
					<p>
						Yes. Resumes tailored to the job description typically
						score higher in ATS keyword matching and tend to get
						more attention from recruiters.
					</p>
				</div>
				{SHARED_FAQS.slice(0, 3).map((faq) => (
					<div key={faq.question} className="mb-6">
						<h3>{faq.question}</h3>
						<p>{faq.answer}</p>
					</div>
				))}
			</>
		),
	},
];

/* ============================================================================
   /chatgpt-resume-prompt-alternative
   ============================================================================ */

export const CHATGPT_ALTERNATIVE_SECTIONS: ContentSection[] = [
	{
		id: "why-prompts-fail",
		title: "Why generic chat prompts fall short",
		content: (
			<>
				<p>
					Using a generic AI chat to rewrite your resume can feel
					convenient, but the results are often inconsistent. Common
					issues include:
				</p>
				<ul>
					<li>
						<strong>Formatting drift.</strong> Each response may
						come back in a different structure — bullet styles,
						heading formats, and spacing vary unpredictably.
					</li>
					<li>
						<strong>Missed keywords.</strong> Without explicit
						instructions, a general-purpose chatbot may skip the
						exact terms an ATS is scanning for.
					</li>
					<li>
						<strong>Fabricated details.</strong> Chat models can
						confidently add experience, tools, or achievements you
						never mentioned — a real risk if you don&apos;t catch
						it.
					</li>
					<li>
						<strong>Prompt engineering overhead.</strong> Getting
						consistently good results means writing long, specific
						prompts — and rewriting them for every application.
					</li>
				</ul>
			</>
		),
	},
	{
		id: "consistent-structure",
		title: "Consistent structure, every time",
		content: (
			<>
				<p>
					ATSResumie produces a clean, consistent format for every
					resume it generates. You don&apos;t need to specify heading
					styles, bullet formats, or section order — the system
					handles that automatically.
				</p>

				{/* Comparison cards */}
				<div className="grid md:grid-cols-2 gap-4 mt-6">
					<div className="rounded border border-border-subtle bg-surface-raised p-5">
						<p className="text-xs font-medium uppercase tracking-wide text-text-tertiary mb-3">
							Generic chat prompt
						</p>
						<ul className="space-y-2 text-sm text-text-secondary">
							<li>Format varies with each generation</li>
							<li>May include cover-letter-style prose</li>
							<li>Section order is unpredictable</li>
							<li>Requires manual cleanup before submitting</li>
						</ul>
					</div>
					<div className="rounded border border-accent-muted bg-surface-raised p-5">
						<p className="text-xs font-medium uppercase tracking-wide text-accent mb-3">
							ATSResumie workflow
						</p>
						<ul className="space-y-2 text-sm text-text-secondary">
							<li>Same clean structure every time</li>
							<li>ATS-optimized formatting by default</li>
							<li>Sections ordered for relevance</li>
							<li>Download-ready PDF output</li>
						</ul>
					</div>
				</div>
			</>
		),
	},
	{
		id: "no-fabrication",
		title: "No fabrication, no surprises",
		content: (
			<>
				<p>
					One of the biggest risks of using a generic AI prompt is
					hallucination — the model invents details that sound
					plausible but aren&apos;t true. On a resume, that can mean:
				</p>
				<ul>
					<li>Tools or languages you&apos;ve never used</li>
					<li>Job titles or companies pulled from thin air</li>
					<li>Metrics and percentages with no basis</li>
				</ul>
				<p>
					ATSResumie is designed to work only with the content you
					provide. It rephrases and restructures — it doesn&apos;t
					invent. And you review the full output before downloading
					anything.
				</p>
			</>
		),
	},
	{
		id: "clean-output",
		title: "Clean, ATS-friendly output",
		content: (
			<>
				<p>
					Even when a chat prompt produces good content, it typically
					comes as raw text you then have to format in Google Docs or
					Word. ATSResumie skips that step entirely:
				</p>
				<ul>
					<li>Professional formatting built into every generation</li>
					<li>Clean PDF export, ready to submit</li>
					<li>Consistent typography and spacing</li>
					<li>No hidden characters or formatting artifacts</li>
				</ul>
				<InlineCTA />
			</>
		),
	},
	{
		id: "faq",
		title: "Frequently asked questions",
		content: (
			<>
				<div className="mb-6">
					<h3>Can&apos;t I just write a better prompt?</h3>
					<p>
						You can, and sometimes it works. But a purpose-built
						tool handles keyword matching, formatting, and
						fact-grounding automatically — without prompt
						engineering for every application.
					</p>
				</div>
				<div className="mb-6">
					<h3>Is ATSResumie just a wrapper around ChatGPT?</h3>
					<p>
						No. ATSResumie uses its own AI pipeline with custom
						instructions designed specifically for resume tailoring.
						The system is built to preserve your real experience and
						match it to the job description.
					</p>
				</div>
				{SHARED_FAQS.slice(0, 3).map((faq) => (
					<div key={faq.question} className="mb-6">
						<h3>{faq.question}</h3>
						<p>{faq.answer}</p>
					</div>
				))}
			</>
		),
	},
];
