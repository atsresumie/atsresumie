"use client";

import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { CreditsProvider } from "@/providers/CreditsProvider";
import {
	SidebarProvider,
	useDashboardSidebar,
} from "@/providers/SidebarProvider";
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
	return (
		<CreditsProvider>
			<SidebarProvider>
				<DashboardShell>{children}</DashboardShell>
			</SidebarProvider>
		</CreditsProvider>
	);
}

function DashboardShell({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();
	const { isOpen, close, toggle } = useDashboardSidebar();

	// Editor page renders its own header with a sidebar toggle, so suppress
	// the floating button there to avoid overlapping its back button.
	const isEditorPage = pathname?.startsWith("/dashboard/editor/") ?? false;

	return (
		<div className={cn("min-h-screen", "bg-surface-base")}>
			<DashboardSidebar isOpen={isOpen} onClose={close} />

			{/* Floating toggle — mobile only, hidden where the page provides its own. */}
			{!isEditorPage && (
				<button
					onClick={toggle}
					className={cn(
						"fixed left-3 top-3 z-30 md:hidden",
						"flex h-9 w-9 items-center justify-center",
						"rounded-md border border-border-subtle bg-surface-raised",
						"text-text-secondary shadow-sm",
						"hover:text-text-primary",
						"transition-colors",
					)}
					aria-label="Open navigation"
				>
					<Menu size={18} />
				</button>
			)}

			<main
				id="main-content"
				className={cn(
					"relative",
					// Offset for sidebar on desktop
					"md:pl-64",
					// Reserve space on mobile for the floating toggle (skip on
					// pages that render their own header, e.g. editor)
					!isEditorPage && "pt-14 md:pt-0",
					// Min height
					"min-h-screen",
				)}
			>
				{children}
			</main>
		</div>
	);
}
