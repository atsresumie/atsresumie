"use client";

import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const [isSidebarOpen, setIsSidebarOpen] = useState(false);

	const handleToggleSidebar = () => {
		setIsSidebarOpen((prev) => !prev);
	};

	const handleCloseSidebar = () => {
		setIsSidebarOpen(false);
	};

	return (
		<div
			className="min-h-screen isolate"
			style={{ backgroundColor: "hsl(24, 28%, 12%)" }}
		>
			{/* 
				CLEAN SOLID BACKGROUND
				- Uses 'isolate' to create stacking context
				- Solid inline bg color prevents any inheritance issues
				- NO gradient overlays or decorative elements
				
				The only visible lines are:
				- Header's bottom border (horizontal line at top)
				- Sidebar's right border (vertical line on left)
				Together these form a clean -|---- pattern
			*/}

			{/* Header - has border-b */}
			<DashboardHeader onToggleSidebar={handleToggleSidebar} />

			{/* Sidebar - has border-r */}
			<DashboardSidebar
				isOpen={isSidebarOpen}
				onClose={handleCloseSidebar}
			/>

			{/* Main content */}
			<main className="relative pt-16 md:pt-20 md:pl-64">
				<div className="min-h-[calc(100vh-4rem)] md:min-h-[calc(100vh-5rem)]">
					{children}
				</div>
			</main>
		</div>
	);
}
