"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { cn } from "@/lib/utils";

/**
 * Dashboard Layout - The Résumé Atelier Design System
 *
 * Main application shell for authenticated dashboard pages.
 * Uses new design tokens for consistent styling.
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
		<div className={cn("min-h-screen", "bg-surface-base")}>
			{/* Header */}
			<DashboardHeader onToggleSidebar={handleToggleSidebar} />

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
					// Offset for header
					"pt-14 md:pt-16",
					// Offset for sidebar on desktop
					"md:pl-64",
					// Min height
					"min-h-screen",
				)}
			>
				{children}
			</main>
		</div>
	);
}
