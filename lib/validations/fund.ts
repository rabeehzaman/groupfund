import { z } from "zod"

export const fundSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(100),
    type: z.enum(["FIXED", "OPEN"]),
    amount: z.coerce.number().positive("Amount must be positive").optional(),
    goalAmount: z.coerce
      .number()
      .positive("Goal must be positive")
      .optional(),
    description: z.string().max(500).default(""),
    purpose: z.string().max(500).default(""),
    isRecurring: z.coerce.boolean().default(true),
  })
  .refine(
    (data) =>
      data.type === "OPEN" || (data.amount !== undefined && data.amount > 0),
    { message: "Amount is required for fixed funds", path: ["amount"] }
  )

export type FundFormValues = z.infer<typeof fundSchema>
