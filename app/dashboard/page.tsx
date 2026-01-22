export default function DashboardPage() {
	return (
		<div className="min-h-screen bg-[#1a120e] text-[#E9DDC7]">
			<div className="mx-auto max-w-4xl px-4 py-20">
				<h1 className="text-3xl font-semibold tracking-tight">
					Dashboard
				</h1>
				<p className="mt-4 text-[rgba(233,221,199,0.75)]">
					Your dashboard is coming soon. Here you'll be able to:
				</p>
				<ul className="mt-6 space-y-3 text-[rgba(233,221,199,0.75)]">
					<li className="flex items-center gap-2">
						<span className="h-2 w-2 rounded-full bg-[#C8B08A]" />
						View your remaining credits
					</li>
					<li className="flex items-center gap-2">
						<span className="h-2 w-2 rounded-full bg-[#C8B08A]" />
						See your generated resumes
					</li>
					<li className="flex items-center gap-2">
						<span className="h-2 w-2 rounded-full bg-[#C8B08A]" />
						Download previous exports
					</li>
					<li className="flex items-center gap-2">
						<span className="h-2 w-2 rounded-full bg-[#C8B08A]" />
						Manage your account settings
					</li>
				</ul>
				<a
					href="/get-started"
					className="mt-10 inline-flex rounded-xl bg-[#C8B08A] px-6 py-3 text-sm font-medium text-[#1a120e] hover:bg-[#d4c4a8] transition-colors"
				>
					← Back to Resume Builder
				</a>
			</div>
		</div>
	);
}
