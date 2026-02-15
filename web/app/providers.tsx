"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/auth/AuthContext";

export default function Providers({ children }: { children: React.ReactNode }) {
	const [queryClient] = React.useState(() => new QueryClient());

	return (
		<QueryClientProvider client={queryClient}>
			<AuthProvider>
				<TooltipProvider>
					{children}
					<Toaster />
					<Sonner />
				</TooltipProvider>
			</AuthProvider>
		</QueryClientProvider>
	);
}

