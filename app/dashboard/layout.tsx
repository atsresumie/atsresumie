"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { CreditsProvider } from "@/providers/CreditsProvider";
import { cn } from "@/lib/utils";

/**
 * Dashboard Layout
 *
 * Main application shell for authenticated dashboard pages.
 * Sidebar-only layout — no top header bar.
 */

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const pathname = usePathname();
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);

	const handleToggleSidebar = () => {
		setIsSidebarOpen((prev) => !prev);
	};

	const handleCloseSidebar = () => {
		setIsSidebarOpen(false);
	};

	return (
		<CreditsProvider>
			<div className={cn("min-h-screen", "bg-surface-base")}>
				{/* Sidebar */}
				<DashboardSidebar
					isOpen={isSidebarOpen}
					onClose={handleCloseSidebar}
				/>

				{/* Main content */}
				<main
					id="main-content"
					className={cn(
						"relative",
						// Offset for sidebar on desktop
						"md:pl-64",
						// Min height
						"min-h-screen",
					)}
				>
					{children}
				</main>
			</div>
		</CreditsProvider>
	);
}

