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
		<div className="min-h-screen bg-background">
			{/* Header */}
			<DashboardHeader onToggleSidebar={handleToggleSidebar} />

			{/* Sidebar */}
			<DashboardSidebar
				isOpen={isSidebarOpen}
				onClose={handleCloseSidebar}
			/>

			{/* Main content area */}
			<main className="pt-16 md:pt-20 md:pl-64">
				<div className="min-h-[calc(100vh-4rem)] md:min-h-[calc(100vh-5rem)] overflow-y-auto">
					{children}
				</div>
			</main>
		</div>
	);
}
