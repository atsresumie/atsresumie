import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/guard";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { CreditAdjustSchema } from "@/lib/admin/schemas";

/**
 * POST /api/admin/credits/adjust
 *
 * Adjusts credits for a user. Logs full ledger data to admin_action_logs:
 * { delta, previous, new, reason }
 */
export async function POST(request: Request) {
	let adminUserId: string;
	try {
		const result = await requireAdmin();
		adminUserId = result.adminUserId;
	} catch (err: unknown) {
		const e = err as { status?: number; message?: string };
		return NextResponse.json(
			{ error: e.message },
			{ status: e.status || 403 },
		);
	}

	try {
		const body = await request.json();
		const parsed = CreditAdjustSchema.safeParse(body);

		if (!parsed.success) {
			return NextResponse.json(
				{ error: parsed.error.flatten().fieldErrors },
				{ status: 400 },
			);
		}

		const { targetUserId, delta, reason } = parsed.data;
		const admin = supabaseAdmin();

		// Get current balance for ledger
		const { data: currentProfile } = await admin
			.from("user_profiles")
			.select("credits")
			.eq("id", targetUserId)
			.single();

		const previousBalance = currentProfile?.credits ?? 0;

		// Check if negative adjustment would result in negative balance
		if (delta < 0 && previousBalance + delta < 0) {
			return NextResponse.json(
				{
					error: `Cannot deduct ${Math.abs(delta)} credits. Current balance is ${previousBalance}.`,
				},
				{ status: 400 },
			);
		}

		// Call the existing RPC
		const { data: newBalance, error: rpcError } = await admin.rpc(
			"adjust_credits_for_user",
			{
				p_user_id: targetUserId,
				p_delta: delta,
				p_reason: reason,
				p_source: "admin",
			},
		);

		if (rpcError) {
			console.error("[Admin Credits] RPC error:", rpcError);
			return NextResponse.json(
				{ error: rpcError.message || "Failed to adjust credits" },
				{ status: 500 },
			);
		}

		// Log to audit trail with full ledger data
		await admin.from("admin_action_logs").insert({
			admin_user_id: adminUserId,
			target_user_id: targetUserId,
			action_type: "credit_adjustment",
			payload: {
				delta,
				previous: previousBalance,
				new: newBalance,
				reason,
			},
		});

		return NextResponse.json({
			success: true,
			newBalance,
			delta,
			previousBalance,
		});
	} catch (error) {
		console.error("[Admin Credits] Error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
