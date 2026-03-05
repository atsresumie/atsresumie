import { z } from "zod";

// ── Credit Adjustment ──────────────────────────────────────────────────────
export const CreditAdjustSchema = z.object({
	targetUserId: z.string().uuid("Invalid user ID"),
	delta: z
		.number()
		.int("Must be a whole number")
		.min(-500, "Cannot adjust more than -500 at once")
		.max(500, "Cannot adjust more than +500 at once")
		.refine((v) => v !== 0, "Delta cannot be zero"),
	reason: z
		.string()
		.min(3, "Reason must be at least 3 characters")
		.max(500, "Reason must be at most 500 characters"),
});

export type CreditAdjustInput = z.infer<typeof CreditAdjustSchema>;

// ── Email Send ─────────────────────────────────────────────────────────────
export const EMAIL_TEMPLATE_TYPES = [
	"support_reply",
	"credits_granted",
	"billing_help",
	"custom",
] as const;

export type EmailTemplateType = (typeof EMAIL_TEMPLATE_TYPES)[number];

export const EmailSendSchema = z.object({
	targetUserId: z.string().uuid("Invalid user ID"),
	toEmail: z.string().email("Invalid email address"),
	templateType: z.enum(EMAIL_TEMPLATE_TYPES),
	subject: z.string().max(200).optional(),
	body: z.string().max(5000).optional(),
	variables: z.record(z.string()).optional(),
});

export type EmailSendInput = z.infer<typeof EmailSendSchema>;

// ── Job Reset ──────────────────────────────────────────────────────────────
export const JobResetSchema = z.object({
	jobId: z.string().uuid("Invalid job ID"),
	reason: z.string().min(3, "Reason required").max(500),
});

export type JobResetInput = z.infer<typeof JobResetSchema>;

// ── Users Query ────────────────────────────────────────────────────────────
export const UsersQuerySchema = z.object({
	query: z.string().optional(),
	page: z.coerce.number().int().min(1).default(1),
	pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type UsersQueryInput = z.infer<typeof UsersQuerySchema>;

// ── Generations Query ──────────────────────────────────────────────────────
export const GenerationsQuerySchema = z.object({
	status: z.string().optional(),
	pdf_status: z.string().optional(),
	userId: z.string().uuid().optional(),
	page: z.coerce.number().int().min(1).default(1),
	pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type GenerationsQueryInput = z.infer<typeof GenerationsQuerySchema>;
