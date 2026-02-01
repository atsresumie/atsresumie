"use client";

import { useState, useEffect } from "react";
import { History, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { deriveJobLabel, getRelativeTime } from "@/hooks/useGenerations";

interface PastGeneration {
	id: string;
	jd_text: string | null;
	created_at: string;
}

interface PastGenerationPickerProps {
	onSelect: (jdText: string) => void;
	disabled?: boolean;
}

/**
 * Dropdown picker for selecting JD from past generations.
 */
export function PastGenerationPicker({
	onSelect,
	disabled,
}: PastGenerationPickerProps) {
	const { isAuthenticated, user } = useAuth();
	const [generations, setGenerations] = useState<PastGeneration[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	// Fetch recent generations with JD
	useEffect(() => {
		async function fetchGenerations() {
			if (!isAuthenticated || !user?.id) {
				setGenerations([]);
				setIsLoading(false);
				return;
			}

			try {
				const supabase = supabaseBrowser();
				const { data, error } = await supabase
					.from("generation_jobs")
					.select("id, jd_text, created_at")
					.eq("user_id", user.id)
					.not("jd_text", "is", null)
					.order("created_at", { ascending: false })
					.limit(10);

				if (error) {
					console.error("Failed to fetch past generations:", error);
				} else {
					setGenerations((data as PastGeneration[]) || []);
				}
			} catch (err) {
				console.error("Failed to fetch past generations:", err);
			} finally {
				setIsLoading(false);
			}
		}

		fetchGenerations();
	}, [isAuthenticated, user?.id]);

	const hasGenerations = generations.length > 0;

	const handleSelect = (gen: PastGeneration) => {
		if (gen.jd_text) {
			onSelect(gen.jd_text);
		}
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="outline"
					size="sm"
					disabled={disabled || isLoading || !hasGenerations}
					className="gap-2"
				>
					<History size={16} />
					Use from past generation
					<ChevronDown size={14} />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="w-72">
				{generations.map((gen) => (
					<DropdownMenuItem
						key={gen.id}
						onClick={() => handleSelect(gen)}
						className="flex flex-col items-start gap-1 py-2"
					>
						<span className="font-medium">
							{deriveJobLabel(gen.jd_text)}
						</span>
						<span className="text-xs text-muted-foreground">
							{getRelativeTime(gen.created_at)}
						</span>
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
