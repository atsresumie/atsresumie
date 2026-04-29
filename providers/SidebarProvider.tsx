"use client";

import {
	createContext,
	useCallback,
	useContext,
	useState,
	type ReactNode,
} from "react";

interface SidebarContextValue {
	isOpen: boolean;
	open: () => void;
	close: () => void;
	toggle: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function SidebarProvider({ children }: { children: ReactNode }) {
	const [isOpen, setIsOpen] = useState(false);

	const open = useCallback(() => setIsOpen(true), []);
	const close = useCallback(() => setIsOpen(false), []);
	const toggle = useCallback(() => setIsOpen((p) => !p), []);

	return (
		<SidebarContext.Provider value={{ isOpen, open, close, toggle }}>
			{children}
		</SidebarContext.Provider>
	);
}

export function useDashboardSidebar() {
	const ctx = useContext(SidebarContext);
	if (!ctx) {
		throw new Error(
			"useDashboardSidebar must be used within a SidebarProvider",
		);
	}
	return ctx;
}
