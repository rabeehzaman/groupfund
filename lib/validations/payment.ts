import { z } from "zod"

export const paymentSchema = z.object({
  date: z.coerce.date(),
  amount: z.coerce.number().positive("Amount must be positive"),
  purpose: z.string().min(1, "Purpose is required").max(200),
  paidTo: z.string().min(1, "Paid to is required").max(200),
  narration: z.string().max(500).default(""),
})

export type PaymentFormValues = z.infer<typeof paymentSchema>
