import { z } from "zod"

export const messageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Message cannot be empty")
    .max(2000, "Message is too long (max 2000 characters)"),
})

export type MessageFormValues = z.infer<typeof messageSchema>
