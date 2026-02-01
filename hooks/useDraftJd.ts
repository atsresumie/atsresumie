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
 * Hook for autosaving JD text to localStorage with debounce.
 * Restores draft on mount and provides a clear function.
 */
export function useDraftJd(): UseDraftJdReturn {
	const [jdText, setJdTextState] = useState("");
	const [isDraftSaved, setIsDraftSaved] = useState(false);
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);
	const isInitializedRef = useRef(false);

	// Restore draft on mount
	useEffect(() => {
		if (typeof window === "undefined") return;

		try {
			const saved = localStorage.getItem(STORAGE_KEY);
			if (saved) {
				setJdTextState(saved);
				setIsDraftSaved(true);
			}
		} catch (err) {
			console.warn("Failed to restore draft:", err);
		}
		isInitializedRef.current = true;
	}, []);

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
