import React from "react";

export interface LegalSection {
	id: string;
	title: string;
	content: React.ReactNode;
}

/* ============================================================================
   TERMS OF SERVICE
   ============================================================================ */

export const TERMS_SECTIONS: LegalSection[] = [
	{
		id: "acceptance-of-terms",
		title: "Acceptance of Terms",
		content: (
			<>
				<p>
					By accessing or using ATSResumie (&quot;the Service&quot;),
					you agree to be bound by these Terms of Service
					(&quot;Terms&quot;). If you do not agree to these Terms,
					please do not use the Service.
				</p>
				<p>
					Your continued use of ATSResumie after any changes to these
					Terms constitutes acceptance of those changes. We encourage
					you to review these Terms periodically.
				</p>
			</>
		),
	},
	{
		id: "who-we-are",
		title: "Who We Are",
		content: (
			<p>
				ATSResumie is an AI-powered resume tailoring platform that helps
				job seekers optimize their resumes for Applicant Tracking
				Systems (ATS). We use artificial intelligence to analyze job
				descriptions and generate tailored resumes that better match the
				roles you&apos;re applying for.
			</p>
		),
	},
	{
		id: "eligibility",
		title: "Eligibility",
		content: (
			<>
				<p>
					You must be at least 16 years of age to use ATSResumie. By
					using the Service, you represent and warrant that you meet
					this age requirement and have the legal capacity to enter
					into these Terms.
				</p>
				<p>
					If you are using the Service on behalf of an organization,
					you represent that you have the authority to bind that
					organization to these Terms.
				</p>
			</>
		),
	},
	{
		id: "accounts-and-security",
		title: "Accounts and Security",
		content: (
			<>
				<p>
					To access certain features, you must create an account using
					email and password or Google OAuth, powered by Supabase
					Auth. You are responsible for:
				</p>
				<ul>
					<li>
						Maintaining the confidentiality of your account
						credentials
					</li>
					<li>All activity that occurs under your account</li>
					<li>
						Notifying us immediately of any unauthorized use of your
						account
					</li>
				</ul>
				<p>
					We reserve the right to suspend or terminate accounts that
					violate these Terms or that we reasonably believe have been
					compromised.
				</p>
			</>
		),
	},
	{
		id: "the-service",
		title: "The Service (What ATSResumie Does)",
		content: (
			<>
				<p>ATSResumie provides the following core functionality:</p>
				<ul>
					<li>
						<strong>Resume tailoring:</strong> You provide your
						existing resume and a job description. Our AI analyzes
						both and generates a tailored version of your resume
						optimized for ATS compatibility.
					</li>
					<li>
						<strong>PDF generation:</strong> Tailored resumes can be
						exported as professionally formatted PDF documents.
					</li>
					<li>
						<strong>Resume management:</strong> Store and manage
						your generated resumes within your account.
					</li>
				</ul>
				<p>
					We strive to keep the Service available and reliable, but we
					do not guarantee uninterrupted access. Features may change,
					be updated, or be discontinued as we improve the product.
				</p>
			</>
		),
	},
	{
		id: "user-content",
		title: "User Content (Resume, Job Descriptions, Prompts)",
		content: (
			<>
				<p>
					&quot;User Content&quot; refers to any text, files, or data
					you submit to ATSResumie, including but not limited to
					resumes, job descriptions, and prompts.
				</p>
				<ul>
					<li>
						You retain full ownership of your User Content at all
						times.
					</li>
					<li>
						By using the Service, you grant us a limited,
						non-exclusive license to process your User Content
						solely for the purpose of providing and improving the
						Service.
					</li>
					<li>
						We do not sell your User Content to third parties or use
						it for purposes unrelated to delivering the Service.
					</li>
				</ul>
			</>
		),
	},
	{
		id: "truth-and-responsibility",
		title: "Truth & Responsibility",
		content: (
			<>
				<p>
					ATSResumie is a <strong>truth-first</strong> platform. Our
					AI tailors and reformats your existing experience — it does
					not invent employment history, fabricate qualifications, or
					add skills you haven&apos;t provided.
				</p>
				<p>However, you are solely responsible for:</p>
				<ul>
					<li>
						Reviewing all AI-generated output before submitting it
						to employers
					</li>
					<li>
						Ensuring the accuracy and truthfulness of your resume
						content
					</li>
					<li>
						Verifying that the generated resume fairly represents
						your qualifications and experience
					</li>
				</ul>
				<p>
					We strongly encourage you to carefully review every
					generated resume before use. ATSResumie is a tool to assist
					you — final responsibility for your resume content rests
					with you.
				</p>
			</>
		),
	},
	{
		id: "acceptable-use",
		title: "Acceptable Use",
		content: (
			<>
				<p>You agree not to use ATSResumie to:</p>
				<ul>
					<li>
						Submit illegal, fraudulent, defamatory, or infringing
						content
					</li>
					<li>
						Generate resumes containing false or misleading
						information
					</li>
					<li>
						Scrape, crawl, or use automated tools to extract data
						from the Service
					</li>
					<li>
						Reverse engineer, decompile, or disassemble any part of
						the Service
					</li>
					<li>
						Attempt to gain unauthorized access to our systems or
						other users&apos; accounts
					</li>
					<li>
						Use the Service in a way that could harm, disable, or
						impair it
					</li>
					<li>Resell or redistribute access to the Service</li>
				</ul>
				<p>
					We reserve the right to suspend or terminate accounts that
					engage in prohibited activities.
				</p>
			</>
		),
	},
	{
		id: "ai-generated-output-disclaimer",
		title: "AI-Generated Output Disclaimer",
		content: (
			<>
				<p>
					ATSResumie uses AI (powered by Anthropic&apos;s Claude) to
					generate resume content. While we strive for accuracy,
					AI-generated output is provided on a{" "}
					<strong>best-effort basis</strong> and may:
				</p>
				<ul>
					<li>
						Contain errors, inaccuracies, or formatting
						inconsistencies
					</li>
					<li>
						Not perfectly capture the nuances of your experience or
						the job requirements
					</li>
					<li>Vary in quality depending on the input provided</li>
				</ul>
				<p>
					You must review and verify all AI-generated content before
					use. We do not guarantee that generated resumes will result
					in interviews, job offers, or successfully pass any specific
					ATS system.
				</p>
			</>
		),
	},
	{
		id: "payments-subscriptions-credits",
		title: "Payments, Subscriptions, Credits",
		content: (
			<>
				<p>
					ATSResumie uses a credit-based system for resume
					generations. Subscriptions and payments are processed
					through Stripe.
				</p>
				<ul>
					<li>
						<strong>Subscriptions:</strong> Certain plans include a
						monthly allocation of credits. Subscription billing
						recurs on a monthly basis until cancelled.
					</li>
					<li>
						<strong>Credits:</strong> Each resume generation
						consumes credits from your account balance. Credit
						amounts and pricing may vary by plan.
					</li>
					<li>
						<strong>Taxes:</strong> Applicable taxes are calculated
						and handled by Stripe where required.
					</li>
					<li>
						<strong>Cancellation:</strong> You may cancel your
						subscription at any time. Access to credits typically
						continues until the end of your current billing period.
					</li>
				</ul>
				<p>
					We reserve the right to change pricing, credit allocations,
					and subscription plans. Any changes will be communicated in
					advance where reasonably possible.
				</p>
			</>
		),
	},
	{
		id: "refunds-and-chargebacks",
		title: "Refunds & Chargebacks",
		content: (
			<>
				<p>
					Refund requests are handled on a case-by-case basis. If you
					believe you are entitled to a refund, please contact us at{" "}
					<a href="mailto:info@atsresumie.com">info@atsresumie.com</a>
					.
				</p>
				<p>
					In the event of a refund, we may adjust your credit balance
					accordingly. We reserve the right to modify or revoke
					credits associated with refunded transactions.
				</p>
				<p>
					Filing a chargeback or dispute without first contacting us
					may result in account suspension pending resolution.
				</p>
			</>
		),
	},
	{
		id: "third-party-services",
		title: "Third-Party Services",
		content: (
			<>
				<p>
					ATSResumie relies on the following third-party services to
					deliver the Service:
				</p>
				<ul>
					<li>
						<strong>Supabase:</strong> Authentication, database, and
						file storage
					</li>
					<li>
						<strong>Stripe:</strong> Payment processing and
						subscription management
					</li>
					<li>
						<strong>Anthropic (Claude):</strong> AI-powered resume
						generation
					</li>
					<li>
						<strong>PDF compilation service:</strong> Document
						rendering and PDF export
					</li>
				</ul>
				<p>
					These services operate under their own terms and privacy
					policies. We are not responsible for the practices or
					availability of third-party services, though we choose
					providers that maintain high standards of security and
					reliability.
				</p>
			</>
		),
	},
	{
		id: "intellectual-property",
		title: "Intellectual Property",
		content: (
			<>
				<p>
					<strong>Our property:</strong> ATSResumie, including its
					design, code, branding, and underlying technology, is owned
					by ATSResumie and protected by applicable intellectual
					property laws. You may not copy, modify, or distribute any
					part of the Service without our written consent.
				</p>
				<p>
					<strong>Your content:</strong> You retain ownership of all
					User Content you submit. By using the Service, you grant us
					a limited, revocable license to process your content solely
					for the purpose of providing the Service.
				</p>
				<p>
					<strong>Generated output:</strong> You are free to use,
					modify, and distribute any resume content generated by the
					Service for your personal and professional purposes.
				</p>
			</>
		),
	},
	{
		id: "termination",
		title: "Termination",
		content: (
			<>
				<p>
					We may suspend or terminate your access to ATSResumie at any
					time, with or without notice, for any reason, including but
					not limited to violation of these Terms.
				</p>
				<p>
					You may stop using the Service at any time. Upon
					termination, your right to access the Service ceases
					immediately, though portions of these Terms that by their
					nature should survive (such as limitations of liability and
					indemnification) will continue to apply.
				</p>
			</>
		),
	},
	{
		id: "disclaimers",
		title: "Disclaimers",
		content: (
			<>
				<p>
					The Service is provided <strong>&quot;as is&quot;</strong>{" "}
					and <strong>&quot;as available&quot;</strong> without
					warranties of any kind, whether express or implied,
					including but not limited to warranties of merchantability,
					fitness for a particular purpose, and non-infringement.
				</p>
				<p>
					We do not warrant that the Service will be uninterrupted,
					error-free, or secure. We do not guarantee the accuracy,
					completeness, or usefulness of any AI-generated content.
				</p>
			</>
		),
	},
	{
		id: "limitation-of-liability",
		title: "Limitation of Liability",
		content: (
			<p>
				To the fullest extent permitted by applicable law, ATSResumie
				and its founders, employees, and affiliates shall not be liable
				for any indirect, incidental, special, consequential, or
				punitive damages, or any loss of profits or revenues, whether
				incurred directly or indirectly, or any loss of data, use,
				goodwill, or other intangible losses, resulting from your use of
				the Service. Our total liability for any claim arising from or
				related to the Service shall not exceed the amount you have paid
				us in the twelve (12) months preceding the claim.
			</p>
		),
	},
	{
		id: "indemnification",
		title: "Indemnification",
		content: (
			<p>
				You agree to indemnify, defend, and hold harmless ATSResumie and
				its officers, directors, employees, and agents from and against
				any claims, liabilities, damages, losses, and expenses
				(including reasonable legal fees) arising out of or in any way
				connected with your access to or use of the Service, your User
				Content, or your violation of these Terms.
			</p>
		),
	},
	{
		id: "changes-to-terms",
		title: "Changes to Terms",
		content: (
			<>
				<p>
					We may update these Terms from time to time. When we make
					significant changes, we will update the &quot;Last
					updated&quot; date at the top of this page and may notify
					you through the Service or via email.
				</p>
				<p>
					Your continued use of ATSResumie after changes are posted
					constitutes acceptance of the revised Terms. If you do not
					agree to the updated Terms, please stop using the Service.
				</p>
			</>
		),
	},
	{
		id: "contact-us",
		title: "Contact Us",
		content: (
			<>
				<p>
					If you have any questions about these Terms of Service,
					please reach out:
				</p>
				<ul>
					<li>
						<strong>Email:</strong>{" "}
						<a href="mailto:info@atsresumie.com">
							info@atsresumie.com
						</a>
					</li>
					<li>
						<strong>Website:</strong>{" "}
						<a
							href="https://atsresumie.com"
							target="_blank"
							rel="noopener noreferrer"
						>
							atsresumie.com
						</a>
					</li>
				</ul>
			</>
		),
	},
];

/* ============================================================================
   PRIVACY POLICY
   ============================================================================ */

export const PRIVACY_SECTIONS: LegalSection[] = [
	{
		id: "overview",
		title: "Overview",
		content: (
			<>
				<p>
					This Privacy Policy describes how ATSResumie
					(&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;)
					collects, uses, and protects your information when you use
					our AI-powered resume tailoring service.
				</p>
				<p>
					We are committed to protecting your privacy and handling
					your data transparently. This policy applies to all users of
					ATSResumie, including our website and application.
				</p>
			</>
		),
	},
	{
		id: "information-we-collect",
		title: "Information We Collect",
		content: (
			<>
				<p>We collect the following types of information:</p>
				<h3>Account Information</h3>
				<ul>
					<li>Email address and authentication identifiers</li>
					<li>
						Account profile data provided through email/password or
						Google OAuth sign-in
					</li>
				</ul>
				<h3>User Content</h3>
				<ul>
					<li>Resume files and text you upload or paste</li>
					<li>Job descriptions you provide for resume tailoring</li>
					<li>Prompts and preferences you set for AI generation</li>
				</ul>
				<h3>Usage Data</h3>
				<ul>
					<li>
						Limited usage data such as feature interactions and
						session information
					</li>
					<li>
						We may collect basic analytics events to understand how
						the Service is used and to improve it
					</li>
				</ul>
				<h3>Cookies & Local Storage</h3>
				<ul>
					<li>Session cookies for authentication</li>
					<li>
						Local storage for onboarding draft data and user
						preferences
					</li>
					<li>
						We do not use third-party tracking cookies for
						advertising purposes
					</li>
				</ul>
			</>
		),
	},
	{
		id: "how-we-use-information",
		title: "How We Use Information",
		content: (
			<>
				<p>We use your information to:</p>
				<ul>
					<li>
						<strong>Provide the Service:</strong> Process your
						resume and job description to generate tailored resumes
					</li>
					<li>
						<strong>Maintain your account:</strong> Authenticate
						your identity and manage your account settings
					</li>
					<li>
						<strong>Process billing:</strong> Handle subscription
						payments and credit management through Stripe
					</li>
					<li>
						<strong>Improve the Service:</strong> Understand usage
						patterns and fix issues
					</li>
					<li>
						<strong>Communicate:</strong> Send important service
						updates, security alerts, and support responses
					</li>
					<li>
						<strong>Ensure security:</strong> Detect and prevent
						fraud, abuse, and unauthorized access
					</li>
				</ul>
			</>
		),
	},
	{
		id: "how-ai-processing-works",
		title: "How AI Processing Works",
		content: (
			<>
				<p>
					When you use ATSResumie, your resume content and job
					description are sent to Anthropic&apos;s Claude AI to
					generate tailored resume output. Here&apos;s what you should
					know:
				</p>
				<ul>
					<li>
						Your content is transmitted securely to Anthropic for
						processing
					</li>
					<li>
						We send only the data necessary to generate your
						tailored resume
					</li>
					<li>
						We do not send your data to train public AI models
						unless explicitly stated by our provider&apos;s
						agreement
					</li>
					<li>
						Anthropic may process your data in accordance with their
						own privacy policy and data processing terms to deliver
						the service
					</li>
				</ul>
				<p>
					For more details on how Anthropic handles data, please refer
					to{" "}
					<a
						href="https://www.anthropic.com/privacy"
						target="_blank"
						rel="noopener noreferrer"
					>
						Anthropic&apos;s Privacy Policy
					</a>
					.
				</p>
			</>
		),
	},
	{
		id: "how-we-share-information",
		title: "How We Share Information",
		content: (
			<>
				<p>
					We share your information only in the following limited
					circumstances:
				</p>
				<ul>
					<li>
						<strong>Service providers:</strong> We share data with
						trusted third-party services that help us deliver
						ATSResumie, including Supabase (infrastructure), Stripe
						(payments), Anthropic (AI processing), and our PDF
						compilation service (document generation).
					</li>
					<li>
						<strong>Legal compliance:</strong> We may disclose
						information if required by law, regulation, legal
						process, or governmental request.
					</li>
					<li>
						<strong>Safety and enforcement:</strong> We may share
						information to protect the rights, property, or safety
						of ATSResumie, our users, or the public.
					</li>
				</ul>
				<p>
					We do not sell your personal information to third parties.
					We do not share your data with advertisers.
				</p>
			</>
		),
	},
	{
		id: "data-retention",
		title: "Data Retention",
		content: (
			<>
				<p>
					We retain your information for as long as your account is
					active or as needed to provide you with the Service.
					Specifically:
				</p>
				<ul>
					<li>
						<strong>Account data:</strong> Retained while your
						account exists
					</li>
					<li>
						<strong>User Content:</strong> Retained as long as
						needed to deliver the Service and enable you to access
						your generated resumes
					</li>
					<li>
						<strong>Usage data:</strong> Generally retained for a
						limited period for analytics and improvement purposes
					</li>
				</ul>
				<p>
					If you wish to delete your content or account, please
					contact us at{" "}
					<a href="mailto:info@atsresumie.com">info@atsresumie.com</a>{" "}
					to request deletion. We will process your request in a
					reasonable timeframe.
				</p>
			</>
		),
	},
	{
		id: "security",
		title: "Security",
		content: (
			<>
				<p>
					We implement industry-standard security measures to protect
					your information, including:
				</p>
				<ul>
					<li>Encrypted data transmission (HTTPS/TLS)</li>
					<li>Secure authentication through Supabase Auth</li>
					<li>
						Access controls and least-privilege principles for
						internal systems
					</li>
					<li>
						Regular security reviews of our third-party providers
					</li>
				</ul>
				<p>
					However, no method of electronic transmission or storage is
					100% secure. While we strive to protect your data, we cannot
					guarantee absolute security. You are responsible for
					maintaining the security of your account credentials.
				</p>
			</>
		),
	},
	{
		id: "your-choices-and-rights",
		title: "Your Choices & Rights",
		content: (
			<>
				<p>
					Depending on your jurisdiction, you may have certain rights
					regarding your personal information:
				</p>
				<ul>
					<li>
						<strong>Access:</strong> Request a copy of the personal
						data we hold about you
					</li>
					<li>
						<strong>Correction:</strong> Request that we correct
						inaccurate information
					</li>
					<li>
						<strong>Deletion:</strong> Request that we delete your
						data (subject to legal retention requirements)
					</li>
					<li>
						<strong>Export:</strong> Request a portable copy of your
						data on a best-effort basis
					</li>
					<li>
						<strong>Marketing opt-out:</strong> Unsubscribe from
						promotional emails at any time using the link provided
						in those emails
					</li>
				</ul>
				<p>
					To exercise any of these rights, please contact us at{" "}
					<a href="mailto:info@atsresumie.com">info@atsresumie.com</a>
					. We will respond to your request within a reasonable
					timeframe.
				</p>
			</>
		),
	},
	{
		id: "international-data-transfers",
		title: "International Data Transfers",
		content: (
			<>
				<p>
					ATSResumie and its service providers may process your data
					in countries outside of Canada, including the United States.
					By using the Service, you consent to the transfer of your
					information to these countries, which may have data
					protection laws different from those in your jurisdiction.
				</p>
				<p>
					We take steps to ensure that your data receives an adequate
					level of protection regardless of where it is processed,
					including through contractual safeguards with our service
					providers.
				</p>
			</>
		),
	},
	{
		id: "childrens-privacy",
		title: "Children's Privacy",
		content: (
			<p>
				ATSResumie is not intended for children under 13 years of age
				(or 16 in certain jurisdictions). We do not knowingly collect
				personal information from children. If we become aware that we
				have collected data from a child under the applicable age, we
				will take steps to delete that information promptly. If you
				believe a child has provided us with personal data, please
				contact us at{" "}
				<a href="mailto:info@atsresumie.com">info@atsresumie.com</a>.
			</p>
		),
	},
	{
		id: "changes-to-this-policy",
		title: "Changes to This Policy",
		content: (
			<>
				<p>
					We may update this Privacy Policy from time to time. When we
					make significant changes, we will update the &quot;Last
					updated&quot; date at the top of this page and may notify
					you through the Service or via email.
				</p>
				<p>
					We encourage you to review this policy periodically. Your
					continued use of ATSResumie after changes are posted
					constitutes acceptance of the updated policy.
				</p>
			</>
		),
	},
	{
		id: "contact-us",
		title: "Contact Us",
		content: (
			<>
				<p>
					If you have questions or concerns about this Privacy Policy
					or how we handle your data, please contact us:
				</p>
				<ul>
					<li>
						<strong>Email:</strong>{" "}
						<a href="mailto:info@atsresumie.com">
							info@atsresumie.com
						</a>
					</li>
					<li>
						<strong>Website:</strong>{" "}
						<a
							href="https://atsresumie.com"
							target="_blank"
							rel="noopener noreferrer"
						>
							atsresumie.com
						</a>
					</li>
				</ul>
			</>
		),
	},
];
