"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface GenerationRow {
	id: string;
	user_id: string;
	status: string;
	pdf_status: string;
	created_at: string;
	updated_at: string;
	last_error: string | null;
	pdf_last_error: string | null;
	attempt_count: number;
	pdf_attempt_count: number;
	next_attempt_at: string | null;
	locked_at: string | null;
	started_at: string | null;
	completed_at: string | null;
}

export default function AdminGenerationsPage() {
	const [generations, setGenerations] = useState<GenerationRow[]>([]);
	const [total, setTotal] = useState(0);
	const [page, setPage] = useState(1);
	const [status, setStatus] = useState<string>("");
	const [pdfStatus, setPdfStatus] = useState<string>("");
	const [userIdFilter, setUserIdFilter] = useState("");
	const [loading, setLoading] = useState(true);
	const [resetDialog, setResetDialog] = useState<{
		job: GenerationRow;
	} | null>(null);
	const [resetReason, setResetReason] = useState("");
	const [resetting, setResetting] = useState(false);
	const pageSize = 20;

	const fetchGenerations = useCallback(async () => {
		setLoading(true);
		try {
			const params = new URLSearchParams({
				page: String(page),
				pageSize: String(pageSize),
			});
			if (status) params.set("status", status);
			if (pdfStatus) params.set("pdf_status", pdfStatus);
			if (userIdFilter) params.set("userId", userIdFilter);

			const res = await fetch(`/api/admin/generations?${params}`);
			const data = await res.json();
			setGenerations(data.generations || []);
			setTotal(data.total || 0);
		} catch {
			toast.error("Failed to load generations");
		} finally {
			setLoading(false);
		}
	}, [page, status, pdfStatus, userIdFilter]);

	useEffect(() => {
		fetchGenerations();
	}, [fetchGenerations]);

	const handleReset = async () => {
		if (!resetDialog || resetReason.trim().length < 3) return;
		setResetting(true);
		try {
			const res = await fetch("/api/admin/generations/reset", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					jobId: resetDialog.job.id,
					reason: resetReason.trim(),
				}),
			});
			const data = await res.json();
			if (!res.ok)
				throw new Error(
					typeof data.error === "string"
						? data.error
						: "Failed to reset",
				);

			toast.success("Job reset to queued");
			setResetDialog(null);
			setResetReason("");
			fetchGenerations();
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to reset job",
			);
		} finally {
			setResetting(false);
		}
	};

	const totalPages = Math.ceil(total / pageSize);
	const isStuck = (g: GenerationRow) =>
		g.status === "processing" &&
		new Date(g.updated_at).getTime() < Date.now() - 10 * 60 * 1000 &&
		g.attempt_count < 3;

	return (
		<div className="p-6 md:p-8">
			<div className="mb-6">
				<h1 className="text-2xl font-semibold tracking-tight text-foreground">
					Generation Jobs
				</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Inspect and manage generation pipeline jobs.
				</p>
			</div>

			{/* Filters */}
			<div className="mb-6 flex flex-wrap gap-3 items-end">
				<div className="space-y-1">
					<Label className="text-xs">Status</Label>
					<Select
						value={status}
						onValueChange={(v) => {
							setPage(1);
							setStatus(v === "all" ? "" : v);
						}}
					>
						<SelectTrigger className="w-[140px]">
							<SelectValue placeholder="All" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All</SelectItem>
							<SelectItem value="queued">Queued</SelectItem>
							<SelectItem value="processing">
								Processing
							</SelectItem>
							<SelectItem value="succeeded">Succeeded</SelectItem>
							<SelectItem value="failed">Failed</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div className="space-y-1">
					<Label className="text-xs">PDF Status</Label>
					<Select
						value={pdfStatus}
						onValueChange={(v) => {
							setPage(1);
							setPdfStatus(v === "all" ? "" : v);
						}}
					>
						<SelectTrigger className="w-[140px]">
							<SelectValue placeholder="All" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All</SelectItem>
							<SelectItem value="none">None</SelectItem>
							<SelectItem value="queued">Queued</SelectItem>
							<SelectItem value="processing">
								Processing
							</SelectItem>
							<SelectItem value="ready">Ready</SelectItem>
							<SelectItem value="failed">Failed</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div className="space-y-1">
					<Label className="text-xs">User ID</Label>
					<div className="relative">
						<Search
							size={14}
							className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
						/>
						<Input
							placeholder="Filter by user ID..."
							value={userIdFilter}
							onChange={(e) => {
								setPage(1);
								setUserIdFilter(e.target.value);
							}}
							className="pl-8 w-[280px]"
						/>
					</div>
				</div>
			</div>

			{/* Table */}
			<div className="rounded-md border border-border-subtle">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Status</TableHead>
							<TableHead>PDF</TableHead>
							<TableHead>Attempts</TableHead>
							<TableHead>User</TableHead>
							<TableHead>Error</TableHead>
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
						) : generations.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={7}
									className="text-center py-8 text-muted-foreground"
								>
									No jobs found.
								</TableCell>
							</TableRow>
						) : (
							generations.map((g) => (
								<TableRow key={g.id}>
									<TableCell>
										<Badge
											variant={
												g.status === "succeeded"
													? "default"
													: g.status === "failed"
														? "destructive"
														: "secondary"
											}
										>
											{g.status}
										</Badge>
									</TableCell>
									<TableCell>
										<Badge variant="outline">
											{g.pdf_status}
										</Badge>
									</TableCell>
									<TableCell className="font-mono text-xs">
										{g.attempt_count}/{g.pdf_attempt_count}
									</TableCell>
									<TableCell className="font-mono text-xs max-w-[120px] truncate">
										{g.user_id.substring(0, 8)}...
									</TableCell>
									<TableCell className="max-w-[200px] truncate text-xs text-red-600">
										{g.last_error ||
											g.pdf_last_error ||
											"—"}
									</TableCell>
									<TableCell className="text-xs text-muted-foreground">
										{new Date(
											g.created_at,
										).toLocaleString()}
									</TableCell>
									<TableCell className="text-right">
										{isStuck(g) && (
											<Button
												variant="outline"
												size="sm"
												onClick={() =>
													setResetDialog({ job: g })
												}
											>
												<RotateCcw
													size={12}
													className="mr-1"
												/>
												Reset
											</Button>
										)}
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

			{/* Reset Dialog */}
			<Dialog
				open={!!resetDialog}
				onOpenChange={(open) => {
					if (!open) {
						setResetDialog(null);
						setResetReason("");
					}
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Reset Stuck Job</DialogTitle>
						<DialogDescription>
							This will reset the job back to &quot;queued&quot;
							so it can be picked up by a worker again.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-3">
						<div className="text-sm">
							<span className="text-muted-foreground">
								Job ID:
							</span>{" "}
							<code className="text-xs">
								{resetDialog?.job.id}
							</code>
						</div>
						<div className="text-sm">
							<span className="text-muted-foreground">
								Attempts:
							</span>{" "}
							{resetDialog?.job.attempt_count}/3
						</div>
						<div className="space-y-2">
							<Label>Reason (required)</Label>
							<Textarea
								value={resetReason}
								onChange={(e) => setResetReason(e.target.value)}
								placeholder="Why is this job being reset?"
								rows={2}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setResetDialog(null)}
						>
							Cancel
						</Button>
						<Button
							onClick={handleReset}
							disabled={
								resetting || resetReason.trim().length < 3
							}
						>
							{resetting ? "Resetting..." : "Reset Job"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
