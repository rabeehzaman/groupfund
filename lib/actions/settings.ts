"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { settingsSchema } from "@/lib/validations/settings"
import { requireAdmin } from "@/lib/auth-utils"

export async function getSettings() {
  let settings = await db.settings.findUnique({ where: { id: "default" } })
  if (!settings) {
    settings = await db.settings.create({
      data: {
        id: "default",
        groupName: "Group Fund",
        defaultMonthlyAmount: 1000,
        financialYearStart: 7,
      },
    })
  }
  return settings
}

export async function updateSettings(_prevState: unknown, formData: FormData) {
  await requireAdmin()
  const parsed = settingsSchema.safeParse({
    groupName: formData.get("groupName"),
    defaultMonthlyAmount: formData.get("defaultMonthlyAmount"),
    defaultYearlyAmount: formData.get("defaultYearlyAmount"),
    financialYearStart: formData.get("financialYearStart"),
  })

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  await db.settings.update({
    where: { id: "default" },
    data: parsed.data,
  })

  revalidatePath("/settings")
  revalidatePath("/dashboard")
  return { success: true }
}
