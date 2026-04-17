import { z } from "zod";

import { MAX_AMOUNT_CENTS } from "./money";

export const createRequestSchema = z.object({
  recipient_email: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Recipient email is required")
    .max(254, "Email is too long")
    .email("Enter a valid email address"),
  amount_cents: z
    .number({ error: "Enter a positive amount" })
    .int("Amount must be in whole cents")
    .positive("Amount must be greater than zero")
    .max(MAX_AMOUNT_CENTS, "Amount is above the allowed maximum"),
  note: z
    .string()
    .trim()
    .max(200, "Note must be 200 characters or fewer")
    .nullable()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
});
export type CreateRequestInput = z.infer<typeof createRequestSchema>;

export const dashboardQuerySchema = z.object({
  direction: z.enum(["incoming", "outgoing"]).default("incoming"),
  status: z
    .enum(["pending", "paid", "declined", "cancelled", "expired", "all"])
    .default("all"),
  q: z.string().trim().max(200).optional().default(""),
});
export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;

export const authSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72, "Password must be 72 characters or fewer"),
});
export type AuthInput = z.infer<typeof authSchema>;
