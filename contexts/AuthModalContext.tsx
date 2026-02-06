"use client";

import {
	createContext,
	useContext,
	useState,
	useCallback,
	type ReactNode,
} from "react";
import AuthModal from "@/components/auth/AuthModal";

type AuthTab = "signin" | "signup";

interface AuthModalContextType {
	openAuthModal: (tab?: AuthTab) => void;
	closeAuthModal: () => void;
}

const AuthModalContext = createContext<AuthModalContextType | null>(null);

export function useAuthModal() {
	const context = useContext(AuthModalContext);
	if (!context) {
		throw new Error("useAuthModal must be used within AuthModalProvider");
	}
	return context;
}

export function AuthModalProvider({ children }: { children: ReactNode }) {
	const [isOpen, setIsOpen] = useState(false);
	const [defaultTab, setDefaultTab] = useState<AuthTab>("signin");

	const openAuthModal = useCallback((tab: AuthTab = "signin") => {
		setDefaultTab(tab);
		setIsOpen(true);
	}, []);

	const closeAuthModal = useCallback(() => {
		setIsOpen(false);
	}, []);

	return (
		<AuthModalContext.Provider value={{ openAuthModal, closeAuthModal }}>
			{children}
			<AuthModal
				open={isOpen}
				onClose={closeAuthModal}
				defaultTab={defaultTab}
			/>
		</AuthModalContext.Provider>
	);
}
