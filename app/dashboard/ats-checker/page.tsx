import { Construction } from "lucide-react";

export default function ATSCheckerPage() {
	return (
		<div
			className="applications-page min-h-screen flex items-center justify-center p-6"
			style={{ backgroundColor: "var(--surface-base)" }}
		>
			<div className="text-center max-w-lg">
				{/* Icon */}
				<div className="mx-auto mb-6 w-20 h-20 rounded-2xl bg-accent-muted border border-accent/20 flex items-center justify-center">
					<Construction size={36} className="text-accent" />
				</div>

				{/* Title */}
				<h1 className="text-5xl md:text-7xl font-extrabold text-text-primary tracking-tight mb-4">
					Under Development
				</h1>

				{/* Subtitle */}
				<p className="text-lg text-text-secondary mb-6">
					ATS Checker is coming soon. We&apos;re building something great to help you score higher on applicant tracking systems.
				</p>

				{/* Decorative accent */}
				<div className="w-24 h-1 rounded-full mx-auto" style={{ background: "linear-gradient(90deg, #e8693a, #d4a574)" }} />
			</div>
		</div>
	);
}
