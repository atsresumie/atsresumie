"use client";

import { useAuthContext } from "@/lib/auth/AuthContext";

/**
 * Custom hook to access authentication state and methods.
 * Must be used within an AuthProvider.
 */
export function useAuth() {
  return useAuthContext();
}
