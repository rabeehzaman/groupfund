import { z } from "zod"

export const memberSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  branch: z.string().max(100).default(""),
  monthlyAmount: z.coerce.number().min(0, "Amount must be positive").default(1000),
  isActive: z.coerce.boolean().default(true),
})

export type MemberFormValues = z.infer<typeof memberSchema>
