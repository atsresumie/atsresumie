"use client";

import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

/**
 * Inner form component that receives profile as initial values
 * This avoids calling setState in useEffect
 */
function ProfileForm({
	initialName,
	initialRoleTitle,
	initialLocation,
	initialIndustries,
	initialSkills,
	updateProfile,
	isSaving,
}: {
	initialName: string;
	initialRoleTitle: string;
	initialLocation: string;
	initialIndustries: string;
	initialSkills: string;
	updateProfile: (data: {
		name: string | null;
		role_title: string | null;
		location: string | null;
		industries: string | null;
		skills: string | null;
	}) => Promise<boolean>;
	isSaving: boolean;
}) {
	const [name, setName] = useState(initialName);
	const [roleTitle, setRoleTitle] = useState(initialRoleTitle);
	const [location, setLocation] = useState(initialLocation);
	const [industries, setIndustries] = useState(initialIndustries);
	const [skills, setSkills] = useState(initialSkills);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		const success = await updateProfile({
			name: name.trim() || null,
			role_title: roleTitle.trim() || null,
			location: location.trim() || null,
			industries: industries.trim() || null,
			skills: skills.trim() || null,
		});

		if (success) {
			toast.success("Profile saved successfully");
		} else {
			toast.error("Failed to save profile");
		}
	};

	return (
		<form onSubmit={handleSubmit} className="mt-8 space-y-6">
			{/* Name */}
			<div className="space-y-2">
				<Label htmlFor="name">Full Name</Label>
				<Input
					id="name"
					value={name}
					onChange={(e) => setName(e.target.value)}
					placeholder="John Doe"
					disabled={isSaving}
				/>
			</div>

			{/* Role/Title */}
			<div className="space-y-2">
				<Label htmlFor="roleTitle">Current Role / Title</Label>
				<Input
					id="roleTitle"
					value={roleTitle}
					onChange={(e) => setRoleTitle(e.target.value)}
					placeholder="Senior Software Engineer"
					disabled={isSaving}
				/>
				<p className="text-xs text-muted-foreground">
					Your current or most recent job title
				</p>
			</div>

			{/* Location */}
			<div className="space-y-2">
				<Label htmlFor="location">Location (optional)</Label>
				<Input
					id="location"
					value={location}
					onChange={(e) => setLocation(e.target.value)}
					placeholder="San Francisco, CA"
					disabled={isSaving}
				/>
			</div>

			{/* Industries */}
			<div className="space-y-2">
				<Label htmlFor="industries">
					Preferred Industries (optional)
				</Label>
				<Input
					id="industries"
					value={industries}
					onChange={(e) => setIndustries(e.target.value)}
					placeholder="Technology, Finance, Healthcare"
					disabled={isSaving}
				/>
				<p className="text-xs text-muted-foreground">
					Comma-separated list of industries you&apos;re targeting
				</p>
			</div>

			{/* Skills */}
			<div className="space-y-2">
				<Label htmlFor="skills">Core Skills (optional)</Label>
				<Input
					id="skills"
					value={skills}
					onChange={(e) => setSkills(e.target.value)}
					placeholder="React, TypeScript, Node.js, AWS"
					disabled={isSaving}
				/>
				<p className="text-xs text-muted-foreground">
					Comma-separated list of your key skills
				</p>
			</div>

			{/* Submit */}
			<Button type="submit" disabled={isSaving}>
				{isSaving ? (
					<>
						<Loader2 size={16} className="mr-2 animate-spin" />
						Saving...
					</>
				) : (
					<>
						<Save size={16} className="mr-2" />
						Save Profile
					</>
				)}
			</Button>
		</form>
	);
}

export default function ProfilePage() {
	const { profile, isLoading, error, updateProfile, isSaving } = useProfile();

	if (isLoading) {
		return (
			<div className="p-6 md:p-8">
				<div className="max-w-2xl">
					<div className="animate-pulse space-y-6">
						<div className="h-8 w-32 bg-muted rounded" />
						<div className="h-4 w-64 bg-muted rounded" />
						<div className="space-y-4">
							{[...Array(5)].map((_, i) => (
								<div key={i} className="space-y-2">
									<div className="h-4 w-24 bg-muted rounded" />
									<div className="h-10 bg-muted rounded" />
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="p-6 md:p-8">
				<div className="max-w-2xl">
					<h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
						Profile
					</h1>
					<div className="mt-8 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
						<p className="text-destructive">{error}</p>
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
					Profile
				</h1>
				<p className="mt-2 text-muted-foreground">
					Your profile information helps us tailor resume generation
					to your background.
				</p>

				{/* Form - use key to remount when profile changes */}
				<ProfileForm
					key={profile?.id}
					initialName={profile?.name || ""}
					initialRoleTitle={profile?.role_title || ""}
					initialLocation={profile?.location || ""}
					initialIndustries={profile?.industries || ""}
					initialSkills={profile?.skills || ""}
					updateProfile={updateProfile}
					isSaving={isSaving}
				/>
			</div>
		</div>
	);
}
