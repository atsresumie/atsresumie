"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronLeft, ChevronRight, Copy } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

interface UserRow {
	id: string;
	email: string | null;
	name: string | null;
	credits: number;
	plan_name: string | null;
	subscription_status: string | null;
	stripe_customer_id: string | null;
	created_at: string;
	is_admin: boolean;
}

export default function AdminUsersPage() {
	const router = useRouter();
	const [users, setUsers] = useState<UserRow[]>([]);
	const [total, setTotal] = useState(0);
	const [page, setPage] = useState(1);
	const [query, setQuery] = useState("");
	const [searchInput, setSearchInput] = useState("");
	const [loading, setLoading] = useState(true);
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

	const copyToClipboard = (text: string) => {
		navigator.clipboard.writeText(text);
		toast.success("Copied!");
	};

	return (
		<div className="p-6 md:p-8">
			<div className="mb-6">
				<h1 className="text-2xl font-semibold tracking-tight text-foreground">
					Users
				</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Search and manage user accounts.
				</p>
			</div>

			{/* Search */}
			<form onSubmit={handleSearch} className="mb-6 flex gap-2 max-w-lg">
				<div className="relative flex-1">
					<Search
						size={16}
						className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
					/>
					<Input
						placeholder="Search by email, name, user ID, or Stripe ID..."
						value={searchInput}
						onChange={(e) => setSearchInput(e.target.value)}
						className="pl-9"
					/>
				</div>
				<Button type="submit" variant="outline">
					Search
				</Button>
			</form>

			{/* Table */}
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
							<TableHead>Status</TableHead>
							<TableHead>Created</TableHead>
							<TableHead className="text-right">
								Actions
							</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{loading ? (
							<TableRow>
								<TableCell
									colSpan={7}
									className="text-center py-8 text-muted-foreground"
								>
									Loading...
								</TableCell>
							</TableRow>
						) : users.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={7}
									className="text-center py-8 text-muted-foreground"
								>
									No users found.
								</TableCell>
							</TableRow>
						) : (
							users.map((user) => (
								<TableRow key={user.id}>
									<TableCell className="font-mono text-xs">
										<span className="flex items-center gap-1">
											{user.email || "—"}
											{user.email && (
												<button
													onClick={() =>
														copyToClipboard(
															user.email!,
														)
													}
													className="text-muted-foreground hover:text-foreground"
												>
													<Copy size={12} />
												</button>
											)}
										</span>
									</TableCell>
									<TableCell className="text-sm">
										{user.name || "—"}
									</TableCell>
									<TableCell className="text-right font-mono">
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
									<TableCell>
										{user.subscription_status ? (
											<Badge
												variant={
													user.subscription_status ===
													"active"
														? "default"
														: "secondary"
												}
											>
												{user.subscription_status}
											</Badge>
										) : (
											<span className="text-xs text-muted-foreground">
												—
											</span>
										)}
									</TableCell>
									<TableCell className="text-xs text-muted-foreground">
										{new Date(
											user.created_at,
										).toLocaleDateString()}
									</TableCell>
									<TableCell className="text-right">
										<div className="flex items-center justify-end gap-1">
											<Button
												variant="ghost"
												size="sm"
												onClick={() =>
													copyToClipboard(user.id)
												}
												title="Copy user ID"
											>
												<Copy size={14} />
											</Button>
											<Button
												variant="outline"
												size="sm"
												onClick={() =>
													router.push(
														`/dashboard/admin/users/${user.id}`,
													)
												}
											>
												View
											</Button>
										</div>
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
		</div>
	);
}
