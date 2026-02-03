"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
	LogOut,
	CreditCard,
	Home,
	Sparkles,
	History,
	Settings,
	HelpCircle,
	User,
	FileText,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCredits } from "@/hooks/useCredits";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

export function ProfileDropdown() {
	const { user, signOut } = useAuth();
	const {
		credits,
		isLoading: creditsLoading,
		error: creditsError,
	} = useCredits();
	const router = useRouter();

	const handleSignOut = async () => {
		await signOut();
		router.push("/");
	};

	// Get initials from email for avatar fallback
	const getInitials = (email: string | undefined) => {
		if (!email) return "U";
		return email.charAt(0).toUpperCase();
	};

	// Get avatar URL from user metadata (e.g., Google OAuth)
	const avatarUrl = user?.user_metadata?.avatar_url;

	const getCreditsDisplay = () => {
		if (creditsLoading) return "…";
		if (creditsError) return "—";
		return credits;
	};

	const getCreditsColor = () => {
		if (credits === 0) return "text-destructive";
		if (credits !== null && credits <= 1) return "text-yellow-500";
		return "text-foreground";
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					className="rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background transition-transform hover:scale-105 active:scale-95"
					aria-label="User menu"
				>
					<Avatar className="h-9 w-9 cursor-pointer border-2 border-border/50 hover:border-border transition-colors">
						{avatarUrl && (
							<AvatarImage src={avatarUrl} alt="User avatar" />
						)}
						<AvatarFallback className="bg-muted text-muted-foreground text-sm font-medium">
							{getInitials(user?.email)}
						</AvatarFallback>
					</Avatar>
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="end"
				className="w-64 bg-card/95 backdrop-blur-md border-border/50"
			>
				{/* Section A: Account Summary */}
				<div className="px-3 py-3">
					<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
						Account
					</p>
					<p className="text-sm font-medium text-foreground truncate mt-1">
						{user?.email}
					</p>
				</div>

				{/* Section B: Credits Row - Clickable */}
				<Link href="/dashboard/credits">
					<div className="mx-2 px-3 py-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2 text-sm text-muted-foreground">
								<CreditCard size={16} />
								<span>Credits remaining</span>
							</div>
							<span
								className={`text-sm font-semibold ${getCreditsColor()}`}
							>
								{getCreditsDisplay()}
							</span>
						</div>
					</div>
				</Link>

				<DropdownMenuSeparator className="my-2" />

				{/* Section C: App Navigation */}
				<DropdownMenuLabel className="text-xs text-muted-foreground px-3 py-1">
					Navigation
				</DropdownMenuLabel>

				<DropdownMenuItem
					asChild
					className="cursor-pointer py-2.5 px-3"
				>
					<Link href="/dashboard" className="flex items-center gap-3">
						<Home size={16} className="text-muted-foreground" />
						<span>Dashboard Home</span>
					</Link>
				</DropdownMenuItem>

				<DropdownMenuItem
					asChild
					className="cursor-pointer py-2.5 px-3"
				>
					<Link
						href="/dashboard/generate"
						className="flex items-center gap-3"
					>
						<Sparkles size={16} className="text-muted-foreground" />
						<span>Generate</span>
					</Link>
				</DropdownMenuItem>

				<DropdownMenuItem
					asChild
					className="cursor-pointer py-2.5 px-3"
				>
					<Link
						href="/dashboard/generations"
						className="flex items-center gap-3"
					>
						<History size={16} className="text-muted-foreground" />
						<span>Past Generations</span>
					</Link>
				</DropdownMenuItem>

				<DropdownMenuSeparator className="my-2" />

				{/* Section D: Account Pages */}
				<DropdownMenuLabel className="text-xs text-muted-foreground px-3 py-1">
					Account
				</DropdownMenuLabel>

				<DropdownMenuItem
					asChild
					className="cursor-pointer py-2.5 px-3"
				>
					<Link
						href="/dashboard/profile"
						className="flex items-center gap-3"
					>
						<User size={16} className="text-muted-foreground" />
						<span>Profile</span>
					</Link>
				</DropdownMenuItem>

				<DropdownMenuItem
					asChild
					className="cursor-pointer py-2.5 px-3"
				>
					<Link
						href="/dashboard/settings"
						className="flex items-center gap-3"
					>
						<Settings size={16} className="text-muted-foreground" />
						<span>Settings</span>
					</Link>
				</DropdownMenuItem>

				<DropdownMenuItem
					asChild
					className="cursor-pointer py-2.5 px-3"
				>
					<Link
						href="/dashboard/account"
						className="flex items-center gap-3"
					>
						<FileText size={16} className="text-muted-foreground" />
						<span>Account Information</span>
					</Link>
				</DropdownMenuItem>

				<DropdownMenuSeparator className="my-2" />

				{/* Section E: Support */}
				<DropdownMenuItem
					asChild
					className="cursor-pointer py-2.5 px-3"
				>
					<a
						href="mailto:support@atsresumie.com"
						className="flex items-center gap-3"
					>
						<HelpCircle
							size={16}
							className="text-muted-foreground"
						/>
						<span>Support</span>
					</a>
				</DropdownMenuItem>

				<DropdownMenuSeparator className="my-2" />

				{/* Section F: Logout */}
				<DropdownMenuItem
					onClick={handleSignOut}
					className="cursor-pointer py-2.5 px-3 text-destructive focus:text-destructive focus:bg-destructive/10"
				>
					<LogOut size={16} className="mr-3" />
					<span>Log out</span>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
