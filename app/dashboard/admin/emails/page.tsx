"use client";

import { useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, Search, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { toast } from "sonner";
import { EMAIL_TEMPLATE_TYPES } from "@/lib/admin/schemas";

interface UserSearchResult {
	id: string;
	email: string | null;
	name: string | null;
}

interface EmailLogRow {
	id: string;
	to_email: string;
	subject: string;
	template_type: string;
	status: string;
	error_message: string | null;
	created_at: string;
}

const TEMPLATE_LABELS: Record<string, string> = {
	support_reply: "Support Reply",
	credits_granted: "Credits Granted",
	billing_help: "Billing Help",
	custom: "Custom",
};

export default function AdminEmailCenterPage() {
	// Send form state
	const [userSearch, setUserSearch] = useState("");
	const [userResults, setUserResults] = useState<UserSearchResult[]>([]);
	const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(
		null,
	);
	const [templateType, setTemplateType] = useState<string>("support_reply");
	const [subject, setSubject] = useState("");
	const [body, setBody] = useState("");
	const [sending, setSending] = useState(false);

	// Log state
	const [logs, setLogs] = useState<EmailLogRow[]>([]);
	const [logsTotal, setLogsTotal] = useState(0);
	const [logsPage, setLogsPage] = useState(1);
	const [logsLoading, setLogsLoading] = useState(true);

	// Search users
	const searchUsers = async () => {
		if (!userSearch.trim()) return;
		try {
			const res = await fetch(
				`/api/admin/users?query=${encodeURIComponent(userSearch)}&pageSize=5`,
			);
			const data = await res.json();
			setUserResults(data.users || []);
		} catch {
			toast.error("Search failed");
		}
	};

	// Fetch email logs
	const fetchLogs = useCallback(async () => {
		setLogsLoading(true);
		try {
			const params = new URLSearchParams({
				page: String(logsPage),
				pageSize: "20",
			});
			const res = await fetch(`/api/admin/email/logs?${params}`);
			if (res.ok) {
				const data = await res.json();
				setLogs(data.logs || []);
				setLogsTotal(data.total || 0);
			}
		} catch {
			// Silently handle
		} finally {
			setLogsLoading(false);
		}
	}, [logsPage]);

	useEffect(() => {
		fetchLogs();
	}, [fetchLogs]);

	const handleSend = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!selectedUser?.email) {
			toast.error("Please select a user with an email address");
			return;
		}

		setSending(true);
		try {
			const res = await fetch("/api/admin/email/send", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					targetUserId: selectedUser.id,
					toEmail: selectedUser.email,
					templateType,
					subject: subject || undefined,
					body: body || undefined,
				}),
			});

			const data = await res.json();
			if (!res.ok)
				throw new Error(
					typeof data.error === "string"
						? data.error
						: "Failed to send",
				);

			toast.success(`Email sent to ${selectedUser.email}`);
			setBody("");
			setSubject("");
			fetchLogs();
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to send email",
			);
		} finally {
			setSending(false);
		}
	};

	return (
		<div className="p-6 md:p-8">
			<div className="mb-6">
				<h1 className="text-2xl font-semibold tracking-tight text-foreground">
					Email Center
				</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					Send templated emails to users. All sends are logged.
				</p>
			</div>

			<div className="grid gap-8 lg:grid-cols-2">
				{/* Send Form */}
				<Card>
					<CardHeader>
						<CardTitle className="text-lg flex items-center gap-2">
							<Send size={18} />
							Compose Email
						</CardTitle>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSend} className="space-y-4">
							{/* User Search */}
							<div className="space-y-2">
								<Label>Recipient</Label>
								{selectedUser ? (
									<div className="flex items-center gap-2 p-2 bg-surface-raised rounded-md">
										<span className="text-sm font-mono flex-1">
											{selectedUser.email}
										</span>
										<Button
											type="button"
											variant="ghost"
											size="sm"
											onClick={() =>
												setSelectedUser(null)
											}
										>
											Change
										</Button>
									</div>
								) : (
									<div className="space-y-2">
										<div className="flex gap-2">
											<div className="relative flex-1">
												<Search
													size={14}
													className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
												/>
												<Input
													placeholder="Search by email..."
													value={userSearch}
													onChange={(e) =>
														setUserSearch(
															e.target.value,
														)
													}
													onKeyDown={(e) => {
														if (e.key === "Enter") {
															e.preventDefault();
															searchUsers();
														}
													}}
													className="pl-8"
												/>
											</div>
											<Button
												type="button"
												variant="outline"
												size="sm"
												onClick={searchUsers}
											>
												Search
											</Button>
										</div>
										{userResults.length > 0 && (
											<div className="border rounded-md divide-y">
												{userResults.map((u) => (
													<button
														key={u.id}
														type="button"
														className="w-full text-left px-3 py-2 hover:bg-surface-raised text-sm"
														onClick={() => {
															setSelectedUser(u);
															setUserResults([]);
														}}
													>
														{u.email ||
															u.name ||
															u.id}
													</button>
												))}
											</div>
										)}
									</div>
								)}
							</div>

							{/* Template */}
							<div className="space-y-2">
								<Label>Template</Label>
								<Select
									value={templateType}
									onValueChange={setTemplateType}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{EMAIL_TEMPLATE_TYPES.map((t) => (
											<SelectItem key={t} value={t}>
												{TEMPLATE_LABELS[t] || t}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							{/* Subject */}
							<div className="space-y-2">
								<Label>Subject (optional)</Label>
								<Input
									placeholder="Custom subject..."
									value={subject}
									onChange={(e) => setSubject(e.target.value)}
								/>
							</div>

							{/* Body */}
							<div className="space-y-2">
								<Label>Message</Label>
								<Textarea
									placeholder="Your message..."
									value={body}
									onChange={(e) => setBody(e.target.value)}
									rows={5}
								/>
							</div>

							<Button
								type="submit"
								disabled={sending || !selectedUser}
								className="w-full"
							>
								{sending ? "Sending..." : "Send Email"}
							</Button>
						</form>
					</CardContent>
				</Card>

				{/* Email Log */}
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">
							Recent Email Log
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-muted-foreground mb-4">
							Email logs are visible per-user in the User Detail →
							Emails tab. This view shows a summary.
						</p>
						{logsLoading ? (
							<p className="text-sm text-muted-foreground py-4 text-center">
								Loading...
							</p>
						) : logs.length === 0 ? (
							<p className="text-sm text-muted-foreground py-4 text-center">
								No recent emails. Logs appear per-user in User
								Detail.
							</p>
						) : (
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>To</TableHead>
										<TableHead>Subject</TableHead>
										<TableHead>Status</TableHead>
										<TableHead>Date</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{logs.map((log) => (
										<TableRow key={log.id}>
											<TableCell className="text-xs font-mono">
												{log.to_email}
											</TableCell>
											<TableCell className="text-xs max-w-[150px] truncate">
												{log.subject}
											</TableCell>
											<TableCell>
												<Badge
													variant={
														log.status === "sent"
															? "default"
															: "destructive"
													}
												>
													{log.status}
												</Badge>
											</TableCell>
											<TableCell className="text-xs text-muted-foreground">
												{new Date(
													log.created_at,
												).toLocaleString()}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
