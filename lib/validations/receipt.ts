import { z } from "zod"

export const receiptSchema = z.object({
  date: z.coerce.date(),
  amount: z.coerce.number().positive("Amount must be positive"),
  forMonth: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "Must be in YYYY-MM format")
    .optional()
    .or(z.literal("")),
  narration: z.string().max(500).default(""),
  memberId: z.string().min(1, "Member is required"),
  fundId: z.string().min(1, "Fund is required"),
})

export type ReceiptFormValues = z.infer<typeof receiptSchema>

export const batchReceiptSchema = z.object({
  date: z.coerce.date(),
  forMonth: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "Must be in YYYY-MM format")
    .optional()
    .or(z.literal("")),
  entries: z.array(
    z.object({
      memberId: z.string(),
      amount: z.coerce.number().positive(),
      narration: z.string().default("Contribution"),
    })
  ),
})
