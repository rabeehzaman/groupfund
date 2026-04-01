"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { supabase, generateId, now } from "@/lib/supabase"
import { fundSchema } from "@/lib/validations/fund"
import { requireAdmin } from "@/lib/auth-utils"

export async function getFunds() {
  const { data, error } = await supabase
    .from('Fund')
    .select('*, Receipt(count)')
    .order('isDefault', { ascending: false })
    .order('name')

  if (error) throw error

  return (data ?? []).map((row: any) => {
    const _count = { receipts: row.Receipt?.[0]?.count ?? 0 }
    const { Receipt, ...rest } = row
    return { ...rest, _count }
  })
}

export async function getActiveFunds() {
  const { data, error } = await supabase
    .from('Fund')
    .select('*')
    .eq('isActive', true)
    .order('isDefault', { ascending: false })
    .order('name')

  if (error) throw error
  return data ?? []
}

export async function getFund(id: string) {
  const { data, error } = await supabase
    .from('Fund')
    .select('*, Receipt(count)')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const _count = { receipts: data.Receipt?.[0]?.count ?? 0 }
  const { Receipt, ...rest } = data
  return { ...rest, _count }
}

export async function getDefaultFund() {
  const { data, error } = await supabase
    .from('Fund')
    .select('*')
    .eq('isDefault', true)
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function createFund(
  _prevState: unknown,
  formData: FormData
) {
  await requireAdmin()
  const raw: Record<string, unknown> = {
    name: formData.get("name"),
    type: formData.get("type"),
    description: formData.get("description"),
    purpose: formData.get("purpose"),
    isRecurring: formData.get("isRecurring") === "true",
  }

  const amount = formData.get("amount")
  if (amount && String(amount).trim() !== "") raw.amount = amount

  const yearlyAmount = formData.get("yearlyAmount")
  if (yearlyAmount && String(yearlyAmount).trim() !== "") raw.yearlyAmount = yearlyAmount

  const goalAmount = formData.get("goalAmount")
  if (goalAmount && String(goalAmount).trim() !== "")
    raw.goalAmount = goalAmount

  const startDate = formData.get("startDate")
  if (startDate && String(startDate).trim() !== "") raw.startDate = startDate

  const parsed = fundSchema.safeParse(raw)

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const data: {
    id: string
    name: string
    type: "FIXED" | "OPEN"
    amount: number | null
    yearlyAmount: number | null
    goalAmount: number | null
    description: string
    purpose: string
    isRecurring: boolean
    startDate: string | null
    createdAt: string
    updatedAt: string
  } = {
    id: generateId(),
    name: parsed.data.name,
    type: parsed.data.type,
    amount: parsed.data.type === "FIXED" ? (parsed.data.amount ?? null) : null,
    yearlyAmount: parsed.data.type === "FIXED" ? (parsed.data.yearlyAmount ?? null) : null,
    goalAmount:
      parsed.data.type === "OPEN" ? (parsed.data.goalAmount ?? null) : null,
    description: parsed.data.description ?? "",
    purpose: parsed.data.purpose ?? "",
    isRecurring: parsed.data.isRecurring ?? true,
    startDate: parsed.data.startDate ? new Date(parsed.data.startDate).toISOString() : null,
    createdAt: now(),
    updatedAt: now(),
  }

  const { error } = await supabase.from('Fund').insert(data)
  if (error) throw error

  revalidatePath("/funds")
  redirect("/funds")
}

export async function updateFund(
  id: string,
  _prevState: unknown,
  formData: FormData
) {
  await requireAdmin()
  const { data: existing, error: existingError } = await supabase
    .from('Fund')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (existingError) throw existingError
  if (!existing) return { error: { name: ["Fund not found"] } }

  const raw: Record<string, unknown> = {
    name: formData.get("name"),
    type: existing.isDefault ? existing.type : formData.get("type"),
    description: formData.get("description"),
    purpose: formData.get("purpose"),
    isRecurring: formData.get("isRecurring") === "true",
  }

  const amount = formData.get("amount")
  if (amount && String(amount).trim() !== "") raw.amount = amount

  const yearlyAmount = formData.get("yearlyAmount")
  if (yearlyAmount && String(yearlyAmount).trim() !== "") raw.yearlyAmount = yearlyAmount

  const goalAmount = formData.get("goalAmount")
  if (goalAmount && String(goalAmount).trim() !== "")
    raw.goalAmount = goalAmount

  const startDate = formData.get("startDate")
  if (startDate && String(startDate).trim() !== "") raw.startDate = startDate

  const parsed = fundSchema.safeParse(raw)

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const data: {
    name: string
    type: "FIXED" | "OPEN"
    amount: number | null
    yearlyAmount: number | null
    goalAmount: number | null
    description: string
    purpose: string
    isRecurring: boolean
    startDate: string | null
    updatedAt: string
  } = {
    name: parsed.data.name,
    type: parsed.data.type,
    amount: parsed.data.type === "FIXED" ? (parsed.data.amount ?? null) : null,
    yearlyAmount: parsed.data.type === "FIXED" ? (parsed.data.yearlyAmount ?? null) : null,
    goalAmount:
      parsed.data.type === "OPEN" ? (parsed.data.goalAmount ?? null) : null,
    description: parsed.data.description ?? "",
    purpose: parsed.data.purpose ?? "",
    isRecurring: parsed.data.isRecurring ?? true,
    startDate: parsed.data.startDate ? new Date(parsed.data.startDate).toISOString() : null,
    updatedAt: now(),
  }

  const { error } = await supabase.from('Fund').update(data).eq('id', id)
  if (error) throw error

  revalidatePath("/funds")
  redirect("/funds")
}

export async function deleteFund(id: string) {
  await requireAdmin()

  const { data: fund, error: fundError } = await supabase
    .from('Fund')
    .select('*, Receipt(count)')
    .eq('id', id)
    .maybeSingle()

  if (fundError) throw fundError
  if (!fund) return { error: "Fund not found" }
  if (fund.isDefault) return { error: "Cannot delete the default fund" }

  const receiptCount = fund.Receipt?.[0]?.count ?? 0
  if (receiptCount > 0)
    return { error: "Cannot delete a fund that has receipts" }

  const { error } = await supabase.from('Fund').delete().eq('id', id)
  if (error) throw error

  revalidatePath("/funds")
  return { success: true }
}
