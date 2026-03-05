"use client";

import { useRouter } from "next/navigation";
import { ShieldX, ArrowLeft, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface AdminAccessDeniedProps {
	userEmail: string | null;
}

export function AdminAccessDenied({ userEmail }: AdminAccessDeniedProps) {
	const router = useRouter();

	return (
		<div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-6">
			<Card className="max-w-md w-full">
				<CardContent className="pt-8 pb-8 text-center space-y-6">
					{/* Icon */}
					<div className="mx-auto w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
						<ShieldX size={32} className="text-red-500" />
					</div>

					{/* Title */}
					<div className="space-y-2">
						<h1 className="text-xl font-semibold tracking-tight">
							Admin Access Required
						</h1>
						<p className="text-sm text-muted-foreground">
							This area is restricted to administrators only.
						</p>
					</div>

					{/* User info */}
					{userEmail ? (
						<div className="bg-surface-raised rounded-lg px-4 py-3 text-sm">
							<p className="text-muted-foreground">
								Signed in as
							</p>
							<p className="font-mono font-medium mt-0.5">
								{userEmail}
							</p>
							<p className="text-xs text-muted-foreground mt-2">
								This account does not have admin privileges.
								Contact the site owner if you believe this is an
								error.
							</p>
						</div>
					) : (
						<div className="bg-surface-raised rounded-lg px-4 py-3 text-sm">
							<p className="text-muted-foreground">
								You need to sign in with an admin account to
								access this area.
							</p>
						</div>
					)}

					{/* Actions */}
					<div className="flex flex-col gap-2">
						<Button
							variant="outline"
							className="w-full"
							onClick={() => router.push("/dashboard")}
						>
							<ArrowLeft size={16} className="mr-2" />
							Back to Dashboard
						</Button>
						{!userEmail && (
							<Button
								className="w-full"
								onClick={() =>
									router.push(
										"/?authRequired=true&next=/dashboard/admin",
									)
								}
							>
								<LogIn size={16} className="mr-2" />
								Sign In
							</Button>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
