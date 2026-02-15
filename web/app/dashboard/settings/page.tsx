"use client";

import { useState } from "react";
import { Shield, Bell, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

/**
 * Inner component for the notification toggle that receives initial value as prop
 * This avoids calling setState in useEffect
 */
function NotificationToggle({
	initialValue,
	updateProfile,
	isSaving,
}: {
	initialValue: boolean;
	updateProfile: (data: { email_on_complete: boolean }) => Promise<boolean>;
	isSaving: boolean;
}) {
	const [emailOnComplete, setEmailOnComplete] = useState(initialValue);

	const handleNotificationToggle = async (checked: boolean) => {
		setEmailOnComplete(checked);
		const success = await updateProfile({ email_on_complete: checked });
		if (success) {
			toast.success(
				checked
					? "You'll receive email notifications"
					: "Email notifications disabled",
			);
		} else {
			// Revert on failure
			setEmailOnComplete(!checked);
			toast.error("Failed to update notification settings");
		}
	};

	return (
		<div className="flex items-center justify-between">
			<div className="space-y-1">
				<Label
					htmlFor="email-notifications"
					className="text-sm font-medium"
				>
					Email me when generation completes
				</Label>
				<p className="text-xs text-muted-foreground">
					Receive an email when your resume is ready
				</p>
			</div>
			<Switch
				id="email-notifications"
				checked={emailOnComplete}
				onCheckedChange={handleNotificationToggle}
				disabled={isSaving}
			/>
		</div>
	);
}

export default function SettingsPage() {
	const { user } = useAuth();
	const { profile, isLoading, updateProfile, isSaving } = useProfile();

	// Determine auth provider
	const getAuthProvider = () => {
		if (!user) return null;

		const provider = user.app_metadata?.provider;
		if (provider === "google") return "Google";
		if (provider === "email") return "Email / Password";
		if (user.email) return "Email / Password";
		return "Unknown";
	};

	const handleDeleteAccount = () => {
		// Placeholder - actual delete flow not implemented
		toast.info("Account deletion is coming soon", {
			description:
				"Please contact support@atsresumie.com to delete your account.",
		});
	};

	if (isLoading) {
		return (
			<div className="p-6 md:p-8">
				<div className="max-w-2xl">
					<div className="animate-pulse space-y-6">
						<div className="h-8 w-32 bg-muted rounded" />
						<div className="h-4 w-64 bg-muted rounded" />
						<div className="space-y-8">
							{[...Array(3)].map((_, i) => (
								<div
									key={i}
									className="h-24 bg-muted rounded-lg"
								/>
							))}
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="p-6 md:p-8">
			<div className="max-w-2xl">
				{/* Header */}
				<h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
					Settings
				</h1>
				<p className="mt-2 text-muted-foreground">
					Manage your account settings and preferences.
				</p>

				<div className="mt-8 space-y-8">
					{/* Auth Section */}
					<div className="p-6 rounded-lg border border-border/50 bg-card/30">
						<div className="flex items-center gap-3 mb-4">
							<Shield
								size={20}
								className="text-muted-foreground"
							/>
							<h2 className="text-lg font-medium">
								Authentication
							</h2>
						</div>
						<div className="space-y-2">
							<p className="text-sm text-muted-foreground">
								Signed in with
							</p>
							<p className="text-sm font-medium">
								{getAuthProvider()}
							</p>
							<p className="text-sm text-muted-foreground truncate">
								{user?.email}
							</p>
						</div>
					</div>

					{/* Notifications Section */}
					<div className="p-6 rounded-lg border border-border/50 bg-card/30">
						<div className="flex items-center gap-3 mb-4">
							<Bell size={20} className="text-muted-foreground" />
							<h2 className="text-lg font-medium">
								Notifications
							</h2>
						</div>
						{/* Use key to remount when profile changes */}
						<NotificationToggle
							key={profile?.id}
							initialValue={profile?.email_on_complete ?? true}
							updateProfile={updateProfile}
							isSaving={isSaving}
						/>
					</div>

					{/* Privacy / Danger Zone */}
					<div className="p-6 rounded-lg border border-destructive/30 bg-destructive/5">
						<div className="flex items-center gap-3 mb-4">
							<Trash2 size={20} className="text-destructive" />
							<h2 className="text-lg font-medium text-destructive">
								Danger Zone
							</h2>
						</div>
						<p className="text-sm text-muted-foreground mb-4">
							Permanently delete your account and all associated
							data. This action cannot be undone.
						</p>
						<AlertDialog>
							<AlertDialogTrigger asChild>
								<Button variant="destructive" size="sm">
									Delete Account
								</Button>
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>
										Delete Account?
									</AlertDialogTitle>
									<AlertDialogDescription>
										This will permanently delete your
										account, all resumes, and generation
										history. This action cannot be undone.
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel>
										Cancel
									</AlertDialogCancel>
									<AlertDialogAction
										onClick={handleDeleteAccount}
										className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
									>
										Delete Account
									</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
					</div>
				</div>
			</div>
		</div>
	);
}
