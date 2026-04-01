"use server"

import { revalidatePath } from "next/cache"
import { supabase, now } from "@/lib/supabase"
import { settingsSchema } from "@/lib/validations/settings"
import { requireAdmin } from "@/lib/auth-utils"

export async function getSettings() {
  const { data: settings, error } = await supabase
    .from('Settings')
    .select('*')
    .eq('id', 'default')
    .maybeSingle()

  if (error) throw error

  if (!settings) {
    const { data: created, error: createError } = await supabase
      .from('Settings')
      .insert({
        id: "default",
        groupName: "Group Fund",
        defaultMonthlyAmount: 1000,
        financialYearStart: 7,
        createdAt: now(),
        updatedAt: now(),
      })
      .select()
      .single()

    if (createError) throw createError
    return created
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

  const { error } = await supabase
    .from('Settings')
    .update({ ...parsed.data, updatedAt: now() })
    .eq('id', 'default')

  if (error) throw error

  revalidatePath("/settings")
  revalidatePath("/dashboard")
  return { success: true }
}
