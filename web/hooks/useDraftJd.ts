"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const STORAGE_KEY = "atsresumie_dashboard_generate_draft";
const DEBOUNCE_MS = 500;

interface UseDraftJdReturn {
	jdText: string;
	setJdText: (text: string) => void;
	clearDraft: () => void;
	isDraftSaved: boolean;
}

/**
 * Get initial JD text from localStorage (runs only on client)
 */
function getInitialJdText(): string {
	if (typeof window === "undefined") return "";
	try {
		return localStorage.getItem(STORAGE_KEY) || "";
	} catch {
		return "";
	}
}

/**
 * Hook for autosaving JD text to localStorage with debounce.
 * Restores draft on mount and provides a clear function.
 */
export function useDraftJd(): UseDraftJdReturn {
	// Use lazy initialization to restore from localStorage
	const [jdText, setJdTextState] = useState(getInitialJdText);
	const [isDraftSaved, setIsDraftSaved] = useState(() => {
		if (typeof window === "undefined") return false;
		try {
			return !!localStorage.getItem(STORAGE_KEY);
		} catch {
			return false;
		}
	});
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);

	// Debounced save to localStorage
	const setJdText = useCallback((text: string) => {
		setJdTextState(text);
		setIsDraftSaved(false);

		// Clear previous timeout
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
		}

		// Debounce save
		timeoutRef.current = setTimeout(() => {
			if (typeof window === "undefined") return;

			try {
				if (text.trim()) {
					localStorage.setItem(STORAGE_KEY, text);
					setIsDraftSaved(true);
				} else {
					localStorage.removeItem(STORAGE_KEY);
				}
			} catch (err) {
				console.warn("Failed to save draft:", err);
			}
		}, DEBOUNCE_MS);
	}, []);

	// Clear draft from localStorage
	const clearDraft = useCallback(() => {
		if (typeof window === "undefined") return;

		try {
			localStorage.removeItem(STORAGE_KEY);
			setJdTextState("");
			setIsDraftSaved(false);
		} catch (err) {
			console.warn("Failed to clear draft:", err);
		}
	}, []);

	// Cleanup timeout on unmount
	useEffect(() => {
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, []);

	return {
		jdText,
		setJdText,
		clearDraft,
		isDraftSaved,
	};
}
