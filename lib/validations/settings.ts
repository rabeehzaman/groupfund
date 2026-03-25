import { z } from "zod"

export const settingsSchema = z.object({
  groupName: z.string().min(1, "Group name is required").max(100),
  defaultMonthlyAmount: z.coerce
    .number()
    .min(0, "Amount must be positive"),
  defaultYearlyAmount: z.coerce
    .number()
    .min(0, "Amount must be positive")
    .default(3000),
  financialYearStart: z.coerce.number().min(1).max(12),
})

export type SettingsFormValues = z.infer<typeof settingsSchema>
