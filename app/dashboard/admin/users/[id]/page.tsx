"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import {
	ArrowLeft,
	Copy,
	CreditCard,
	Zap,
	Mail,
	Shield,
	User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { CreditAdjustDialog } from "@/components/admin/CreditAdjustDialog";
import { EmailSendDialog } from "@/components/admin/EmailSendDialog";

interface UserDetailData {
	profile: {
		id: string;
		email: string | null;
		name: string | null;
		credits: number;
		plan_name: string | null;
		subscription_status: string | null;
		stripe_customer_id: string | null;
		created_at: string;
		is_admin: boolean;
	};
	authUser: {
		email: string;
		created_at: string;
		last_sign_in_at: string | null;
		email_confirmed_at: string | null;
		user_metadata: Record<string, unknown>;
	} | null;
	counts: {
		generations: number;
		purchases: number;
		emails: number;
		adminActions: number;
	};
	generations: Array<Record<string, unknown>>;
	purchases: Array<Record<string, unknown>>;
	emailLogs: Array<Record<string, unknown>>;
	actionLogs: Array<Record<string, unknown>>;
}

export default function AdminUserDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = use(params);
	const router = useRouter();
	const [data, setData] = useState<UserDetailData | null>(null);
	const [loading, setLoading] = useState(true);
	const [creditDialogOpen, setCreditDialogOpen] = useState(false);
	const [emailDialogOpen, setEmailDialogOpen] = useState(false);

	const fetchUser = async () => {
		setLoading(true);
		try {
			const res = await fetch(`/api/admin/users/${id}`);
			if (!res.ok) throw new Error("Not found");
			setData(await res.json());
		} catch {
			toast.error("Failed to load user");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchUser();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [id]);

	const copy = (text: string) => {
		navigator.clipboard.writeText(text);
		toast.success("Copied!");
	};

	if (loading) {
		return (
			<div className="p-6 md:p-8 space-y-4">
				<Skeleton className="h-8 w-48" />
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
					{[1, 2, 3, 4].map((i) => (
						<Skeleton key={i} className="h-24" />
					))}
				</div>
			</div>
		);
	}

	if (!data) {
		return (
			<div className="p-6 md:p-8">
				<p className="text-muted-foreground">User not found.</p>
			</div>
		);
	}

	const { profile, authUser, counts } = data;

	return (
		<div className="p-6 md:p-8">
			{/* Header */}
			<div className="mb-6 flex items-center gap-4">
				<Button
					variant="ghost"
					size="sm"
					onClick={() => router.push("/dashboard/admin/users")}
				>
					<ArrowLeft size={16} />
				</Button>
				<div className="flex-1 min-w-0">
					<h1 className="text-xl font-semibold tracking-tight truncate">
						{profile.email || profile.name || id}
					</h1>
					<div className="flex items-center gap-2 mt-1">
						<button
							onClick={() => copy(id)}
							className="text-xs font-mono text-muted-foreground hover:text-foreground flex items-center gap-1"
						>
							{id.substring(0, 8)}...
							<Copy size={10} />
						</button>
						{profile.is_admin && (
							<Badge variant="destructive">Admin</Badge>
						)}
					</div>
				</div>
				<div className="flex gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => setCreditDialogOpen(true)}
					>
						<CreditCard size={14} className="mr-1" />
						Adjust Credits
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => setEmailDialogOpen(true)}
					>
						<Mail size={14} className="mr-1" />
						Send Email
					</Button>
				</div>
			</div>

			{/* Summary Cards */}
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm text-muted-foreground">
							Credits
						</CardTitle>
						<CreditCard size={16} className="text-amber-600" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{profile.credits}
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm text-muted-foreground">
							Subscription
						</CardTitle>
						<Shield size={16} className="text-emerald-600" />
					</CardHeader>
					<CardContent>
						<Badge>{profile.subscription_status || "free"}</Badge>
						<p className="text-xs text-muted-foreground mt-1">
							{profile.plan_name || "free"}
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm text-muted-foreground">
							Generations
						</CardTitle>
						<Zap size={16} className="text-blue-600" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{counts.generations}
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between pb-2">
						<CardTitle className="text-sm text-muted-foreground">
							Purchases
						</CardTitle>
						<CreditCard size={16} className="text-indigo-600" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{counts.purchases}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Tabs */}
			<Tabs defaultValue="profile" className="space-y-4">
				<TabsList>
					<TabsTrigger value="profile">
						<User size={14} className="mr-1" />
						Profile
					</TabsTrigger>
					<TabsTrigger value="generations">
						Generations ({counts.generations})
					</TabsTrigger>
					<TabsTrigger value="purchases">
						Purchases ({counts.purchases})
					</TabsTrigger>
					<TabsTrigger value="emails">
						Emails ({counts.emails})
					</TabsTrigger>
					<TabsTrigger value="audit">
						Audit ({counts.adminActions})
					</TabsTrigger>
				</TabsList>

				{/* Profile Tab */}
				<TabsContent value="profile">
					<Card>
						<CardContent className="pt-6">
							<dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
								<div>
									<dt className="text-muted-foreground">
										Email
									</dt>
									<dd className="font-mono">
										{authUser?.email ||
											profile.email ||
											"—"}
									</dd>
								</div>
								<div>
									<dt className="text-muted-foreground">
										Name
									</dt>
									<dd>{profile.name || "—"}</dd>
								</div>
								<div>
									<dt className="text-muted-foreground">
										Last Sign In
									</dt>
									<dd>
										{authUser?.last_sign_in_at
											? new Date(
													authUser.last_sign_in_at,
												).toLocaleString()
											: "—"}
									</dd>
								</div>
								<div>
									<dt className="text-muted-foreground">
										Created
									</dt>
									<dd>
										{new Date(
											profile.created_at,
										).toLocaleString()}
									</dd>
								</div>
								<div>
									<dt className="text-muted-foreground">
										Stripe Customer
									</dt>
									<dd className="font-mono text-xs">
										{profile.stripe_customer_id ? (
											<button
												onClick={() =>
													copy(
														profile.stripe_customer_id!,
													)
												}
												className="flex items-center gap-1 hover:text-foreground"
											>
												{profile.stripe_customer_id}
												<Copy size={10} />
											</button>
										) : (
											"—"
										)}
									</dd>
								</div>
								<div>
									<dt className="text-muted-foreground">
										Email Confirmed
									</dt>
									<dd>
										{authUser?.email_confirmed_at
											? new Date(
													authUser.email_confirmed_at,
												).toLocaleString()
											: "Not confirmed"}
									</dd>
								</div>
							</dl>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Generations Tab */}
				<TabsContent value="generations">
					<Card>
						<CardContent className="pt-6">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Status</TableHead>
										<TableHead>PDF</TableHead>
										<TableHead>Attempts</TableHead>
										<TableHead>Error</TableHead>
										<TableHead>Created</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{data.generations.length === 0 ? (
										<TableRow>
											<TableCell
												colSpan={5}
												className="text-center py-4 text-muted-foreground"
											>
												No generations.
											</TableCell>
										</TableRow>
									) : (
										data.generations.map((g) => (
											<TableRow key={g.id as string}>
												<TableCell>
													<Badge
														variant={
															g.status ===
															"succeeded"
																? "default"
																: g.status ===
																	  "failed"
																	? "destructive"
																	: "secondary"
														}
													>
														{g.status as string}
													</Badge>
												</TableCell>
												<TableCell>
													<Badge variant="outline">
														{g.pdf_status as string}
													</Badge>
												</TableCell>
												<TableCell className="font-mono text-xs">
													{g.attempt_count as number}
												</TableCell>
												<TableCell className="max-w-[200px] truncate text-xs text-red-600">
													{(g.last_error as string) ||
														"—"}
												</TableCell>
												<TableCell className="text-xs text-muted-foreground">
													{new Date(
														g.created_at as string,
													).toLocaleString()}
												</TableCell>
											</TableRow>
										))
									)}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Purchases Tab */}
				<TabsContent value="purchases">
					<Card>
						<CardContent className="pt-6">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Pack</TableHead>
										<TableHead className="text-right">
											Credits
										</TableHead>
										<TableHead className="text-right">
											Amount
										</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Date</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{data.purchases.length === 0 ? (
										<TableRow>
											<TableCell
												colSpan={5}
												className="text-center py-4 text-muted-foreground"
											>
												No purchases.
											</TableCell>
										</TableRow>
									) : (
										data.purchases.map((p) => (
											<TableRow key={p.id as string}>
												<TableCell>
													{p.pack_id as string}
												</TableCell>
												<TableCell className="text-right font-mono">
													{p.credits_amount as number}
												</TableCell>
												<TableCell className="text-right font-mono">
													$
													{(
														(p.amount_paid_cents as number) /
														100
													).toFixed(2)}
												</TableCell>
												<TableCell>
													<Badge
														variant={
															p.status ===
															"succeeded"
																? "default"
																: "secondary"
														}
													>
														{p.status as string}
													</Badge>
												</TableCell>
												<TableCell className="text-xs text-muted-foreground">
													{new Date(
														p.created_at as string,
													).toLocaleString()}
												</TableCell>
											</TableRow>
										))
									)}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Emails Tab */}
				<TabsContent value="emails">
					<Card>
						<CardContent className="pt-6">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Subject</TableHead>
										<TableHead>Template</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Date</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{data.emailLogs.length === 0 ? (
										<TableRow>
											<TableCell
												colSpan={4}
												className="text-center py-4 text-muted-foreground"
											>
												No emails sent.
											</TableCell>
										</TableRow>
									) : (
										data.emailLogs.map((e) => (
											<TableRow key={e.id as string}>
												<TableCell className="max-w-[200px] truncate text-sm">
													{e.subject as string}
												</TableCell>
												<TableCell>
													<Badge variant="outline">
														{
															e.template_type as string
														}
													</Badge>
												</TableCell>
												<TableCell>
													<Badge
														variant={
															e.status === "sent"
																? "default"
																: "destructive"
														}
													>
														{e.status as string}
													</Badge>
												</TableCell>
												<TableCell className="text-xs text-muted-foreground">
													{new Date(
														e.created_at as string,
													).toLocaleString()}
												</TableCell>
											</TableRow>
										))
									)}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				</TabsContent>

				{/* Audit Log Tab */}
				<TabsContent value="audit">
					<Card>
						<CardContent className="pt-6">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Action</TableHead>
										<TableHead>Details</TableHead>
										<TableHead>Date</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{data.actionLogs.length === 0 ? (
										<TableRow>
											<TableCell
												colSpan={3}
												className="text-center py-4 text-muted-foreground"
											>
												No admin actions.
											</TableCell>
										</TableRow>
									) : (
										data.actionLogs.map((a) => {
											const payload = a.payload as Record<
												string,
												unknown
											>;
											return (
												<TableRow key={a.id as string}>
													<TableCell>
														<Badge variant="outline">
															{
																a.action_type as string
															}
														</Badge>
													</TableCell>
													<TableCell className="text-xs font-mono max-w-[300px] truncate">
														{JSON.stringify(
															payload,
														)}
													</TableCell>
													<TableCell className="text-xs text-muted-foreground">
														{new Date(
															a.created_at as string,
														).toLocaleString()}
													</TableCell>
												</TableRow>
											);
										})
									)}
								</TableBody>
							</Table>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>

			{/* Dialogs */}
			<CreditAdjustDialog
				open={creditDialogOpen}
				onOpenChange={setCreditDialogOpen}
				targetUserId={id}
				targetEmail={profile.email || authUser?.email || ""}
				currentCredits={profile.credits}
				onSuccess={fetchUser}
			/>
			<EmailSendDialog
				open={emailDialogOpen}
				onOpenChange={setEmailDialogOpen}
				targetUserId={id}
				targetEmail={profile.email || authUser?.email || ""}
			/>
		</div>
	);
}
