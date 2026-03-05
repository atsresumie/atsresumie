import { OverviewMetrics } from "@/components/admin/OverviewMetrics";

export default function AdminOverviewPage() {
	return (
		<div className="p-6 md:p-8">
			<div className="mb-8">
				<h1 className="text-2xl font-semibold tracking-tight text-foreground">
					Admin Overview
				</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					System metrics and quick stats.
				</p>
			</div>
			<OverviewMetrics />
		</div>
	);
}
