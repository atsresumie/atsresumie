"use client";

import { supabaseBrowser } from "@/lib/supabase/browser";

/**
 * Sign up with email and password.
 * User is automatically signed in after successful signup.
 */
export async function signUpWithEmail(email: string, password: string) {
	const supabase = supabaseBrowser();
	const { data, error } = await supabase.auth.signUp({
		email,
		password,
		options: {
			emailRedirectTo: `${process.env.APP_URL}/auth/callback`,
		},
	});

	if (error) {
		throw error;
	}

	return data;
}

/**
 * Sign in with email and password.
 */
export async function signInWithEmail(email: string, password: string) {
	const supabase = supabaseBrowser();
	const { data, error } = await supabase.auth.signInWithPassword({
		email,
		password,
	});

	if (error) {
		throw error;
	}

	return data;
}

/**
 * Sign in with Google OAuth.
 * Redirects to Google for authentication.
 */
export async function signInWithGoogle(redirectTo?: string) {
	const supabase = supabaseBrowser();

	const { data, error } = await supabase.auth.signInWithOAuth({
		provider: "google",
		options: {
			redirectTo: redirectTo || `${window.location.origin}/auth/callback`,
		},
	});

	if (error) {
		throw error;
	}

	return data;
}

/**
 * Sign out the current user.
 */
export async function signOut() {
	const supabase = supabaseBrowser();
	const { error } = await supabase.auth.signOut();

	if (error) {
		throw error;
	}
}

/**
 * Get the current authenticated user.
 */
export async function getCurrentUser() {
	const supabase = supabaseBrowser();
	const {
		data: { user },
		error,
	} = await supabase.auth.getUser();

	if (error) {
		throw error;
	}

	return user;
}
