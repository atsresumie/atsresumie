"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	type GenerationJobStatus,
	STATUS_LABELS,
} from "@/hooks/useGenerations";

interface GenerationsFiltersProps {
	statusFilter: GenerationJobStatus | "all";
	onStatusFilterChange: (status: GenerationJobStatus | "all") => void;
	searchQuery: string;
	onSearchChange: (query: string) => void;
}

const STATUS_OPTIONS: Array<{
	value: GenerationJobStatus | "all";
	label: string;
}> = [
	{ value: "all", label: "All statuses" },
	{ value: "queued", label: STATUS_LABELS.queued },
	{ value: "processing", label: STATUS_LABELS.processing },
	{ value: "succeeded", label: STATUS_LABELS.succeeded },
	{ value: "failed", label: STATUS_LABELS.failed },
];

export function GenerationsFilters({
	statusFilter,
	onStatusFilterChange,
	searchQuery,
	onSearchChange,
}: GenerationsFiltersProps) {
	return (
		<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
			{/* Search */}
			<div className="relative flex-1">
				<Search
					size={16}
					className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
				/>
				<Input
					type="text"
					placeholder="Search by job description..."
					value={searchQuery}
					onChange={(e) => onSearchChange(e.target.value)}
					className="pl-9"
				/>
			</div>

			{/* Status filter */}
			<Select
				value={statusFilter}
				onValueChange={(value) =>
					onStatusFilterChange(value as GenerationJobStatus | "all")
				}
			>
				<SelectTrigger className="w-full sm:w-[160px]">
					<SelectValue placeholder="Filter by status" />
				</SelectTrigger>
				<SelectContent>
					{STATUS_OPTIONS.map((option) => (
						<SelectItem key={option.value} value={option.value}>
							{option.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}
