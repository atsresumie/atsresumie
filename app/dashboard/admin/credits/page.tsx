"use client";

import { useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CreditAdjustDialog } from "@/components/admin/CreditAdjustDialog";

interface UserForCredits {
	id: string;
	email: string | null;
	name: string | null;
	credits: number;
	plan_name: string | null;
}

export default function AdminCreditsPage() {
	const [users, setUsers] = useState<UserForCredits[]>([]);
	const [total, setTotal] = useState(0);
	const [page, setPage] = useState(1);
	const [query, setQuery] = useState("");
	const [searchInput, setSearchInput] = useState("");
	const [loading, setLoading] = useState(true);
	const [creditDialog, setCreditDialog] = useState<UserForCredits | null>(
		null,
	);
	const pageSize = 20;

	const fetchUsers = useCallback(async () => {
		setLoading(true);
		try {
			const params = new URLSearchParams({
				page: String(page),
				pageSize: String(pageSize),
			});
			if (query) params.set("query", query);
			const res = await fetch(`/api/admin/users?${params}`);
			const data = await res.json();
			setUsers(data.users || []);
			setTotal(data.total || 0);
		} catch {
			toast.error("Failed to load users");
		} finally {
			setLoading(false);
		}
	}, [page, query]);

	useEffect(() => {
		fetchUsers();
	}, [fetchUsers]);

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		setPage(1);
		setQuery(searchInput);
	};

	const totalPages = Math.ceil(total / pageSize);

	return (
		<div className="p-6 md:p-8">
			<div className="mb-6">
				<h1 className="text-2xl font-semibold tracking-tight text-foreground">
					Credits & Purchases
				</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Search users and adjust their credit balances.
				</p>
			</div>

			{/* Quick Adjust Section */}
			<Card className="mb-8">
				<CardHeader>
					<CardTitle className="text-lg">Credit Adjustment</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-muted-foreground mb-4">
						Search for a user below, then click &quot;Adjust&quot;
						to grant or revoke credits. All adjustments are logged
						in the audit trail.
					</p>
					<form
						onSubmit={handleSearch}
						className="flex gap-2 max-w-lg"
					>
						<div className="relative flex-1">
							<Search
								size={16}
								className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
							/>
							<Input
								placeholder="Search by email or user ID..."
								value={searchInput}
								onChange={(e) => setSearchInput(e.target.value)}
								className="pl-9"
							/>
						</div>
						<Button type="submit" variant="outline">
							Search
						</Button>
					</form>
				</CardContent>
			</Card>

			{/* Users Table */}
			<div className="rounded-md border border-border-subtle">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Email</TableHead>
							<TableHead>Name</TableHead>
							<TableHead className="text-right">
								Credits
							</TableHead>
							<TableHead>Plan</TableHead>
							<TableHead className="text-right">
								Actions
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{loading ? (
							<TableRow>
								<TableCell
									colSpan={5}
									className="text-center py-8 text-muted-foreground"
								>
									Loading...
								</TableCell>
							</TableRow>
						) : users.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={5}
									className="text-center py-8 text-muted-foreground"
								>
									{query
										? "No users found."
										: "Search for a user to adjust credits."}
								</TableCell>
							</TableRow>
						) : (
							users.map((user) => (
								<TableRow key={user.id}>
									<TableCell className="font-mono text-xs">
										{user.email || "—"}
									</TableCell>
									<TableCell className="text-sm">
										{user.name || "—"}
									</TableCell>
									<TableCell className="text-right font-mono font-bold">
										{user.credits}
									</TableCell>
									<TableCell>
										<Badge
											variant={
												user.plan_name === "free"
													? "secondary"
													: "default"
											}
										>
											{user.plan_name || "free"}
										</Badge>
									</TableCell>
									<TableCell className="text-right">
										<Button
											variant="outline"
											size="sm"
											onClick={() =>
												setCreditDialog(user)
											}
										>
											Adjust
										</Button>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>

			{/* Pagination */}
			{totalPages > 1 && (
				<div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
					<span>
						Showing {(page - 1) * pageSize + 1}–
						{Math.min(page * pageSize, total)} of {total}
					</span>
					<div className="flex gap-2">
						<Button
							variant="outline"
							size="sm"
							disabled={page <= 1}
							onClick={() => setPage((p) => p - 1)}
						>
							<ChevronLeft size={14} />
						</Button>
						<Button
							variant="outline"
							size="sm"
							disabled={page >= totalPages}
							onClick={() => setPage((p) => p + 1)}
						>
							<ChevronRight size={14} />
						</Button>
					</div>
				</div>
			)}

			{/* Credit Adjust Dialog */}
			{creditDialog && (
				<CreditAdjustDialog
					open={!!creditDialog}
					onOpenChange={(open) => {
						if (!open) setCreditDialog(null);
					}}
					targetUserId={creditDialog.id}
					targetEmail={creditDialog.email || ""}
					currentCredits={creditDialog.credits}
					onSuccess={fetchUsers}
				/>
			)}
		</div>
	);
}
