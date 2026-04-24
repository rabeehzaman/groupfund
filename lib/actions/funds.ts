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
    .select('*, Receipt(count), MemberFund(memberId)')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const _count = { receipts: data.Receipt?.[0]?.count ?? 0 }
  const memberIds = (data.MemberFund ?? []).map((mf: any) => mf.memberId)
  const { Receipt, MemberFund, ...rest } = data
  return { ...rest, _count, memberIds }
}

export async function getFundMemberIds(fundId: string) {
  const { data, error } = await supabase
    .from('MemberFund')
    .select('memberId')
    .eq('fundId', fundId)
  if (error) throw error
  return (data ?? []).map((mf: any) => mf.memberId)
}

type MinimalMember = { id: string; name: string; branch: string; joinDate?: string }

export async function getMembersForFund<T extends MinimalMember>(
  fund: { id: string; appliesToAllMembers?: boolean },
  columns = "id, name, branch",
): Promise<T[]> {
  let query = supabase
    .from("Member")
    .select(columns)
    .eq("isActive", true)
    .order("name")

  if (fund.appliesToAllMembers === false) {
    const ids = await getFundMemberIds(fund.id)
    if (ids.length === 0) return []
    query = query.in("id", ids)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as unknown as T[]
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
  const memberIdsRaw = formData.getAll("memberIds").map(String).filter(Boolean)

  const raw: Record<string, unknown> = {
    name: formData.get("name"),
    type: formData.get("type"),
    description: formData.get("description"),
    purpose: formData.get("purpose"),
    isRecurring: formData.get("isRecurring") === "true",
    isChitFund: formData.get("isChitFund") === "true",
    appliesToAllMembers: formData.get("appliesToAllMembers") !== "false",
    memberIds: memberIdsRaw,
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

  if (parsed.data.isChitFund) {
    const { data: existingChit, error: chitCheckError } = await supabase
      .from("Fund")
      .select("id")
      .eq("isChitFund", true)
      .maybeSingle()
    if (chitCheckError) throw chitCheckError
    if (existingChit) {
      return {
        error: {
          isChitFund: ["Another fund is already marked as the chit fund."],
        },
      }
    }
  }

  const fundId = generateId()
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
    isChitFund: boolean
    appliesToAllMembers: boolean
    startDate: string | null
    createdAt: string
    updatedAt: string
  } = {
    id: fundId,
    name: parsed.data.name,
    type: parsed.data.type,
    amount: parsed.data.type === "FIXED" ? (parsed.data.amount ?? null) : null,
    yearlyAmount: parsed.data.type === "FIXED" ? (parsed.data.yearlyAmount ?? null) : null,
    goalAmount:
      parsed.data.type === "OPEN" ? (parsed.data.goalAmount ?? null) : null,
    description: parsed.data.description ?? "",
    purpose: parsed.data.purpose ?? "",
    isRecurring: parsed.data.isRecurring ?? true,
    isChitFund: parsed.data.isChitFund ?? false,
    appliesToAllMembers: parsed.data.appliesToAllMembers ?? true,
    startDate: parsed.data.startDate ? new Date(parsed.data.startDate).toISOString() : null,
    createdAt: now(),
    updatedAt: now(),
  }

  const { error } = await supabase.from('Fund').insert(data)
  if (error) throw error

  if (!data.appliesToAllMembers && parsed.data.memberIds.length > 0) {
    const timestamp = now()
    const rows = parsed.data.memberIds.map((memberId) => ({
      fundId,
      memberId,
      createdAt: timestamp,
    }))
    const { error: mfError } = await supabase.from('MemberFund').insert(rows)
    if (mfError) throw mfError
  }

  revalidatePath("/funds")
  revalidatePath("/chit-fund")
  revalidatePath("/dashboard")
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

  const memberIdsRaw = formData.getAll("memberIds").map(String).filter(Boolean)

  const raw: Record<string, unknown> = {
    name: formData.get("name"),
    type: existing.isDefault ? existing.type : formData.get("type"),
    description: formData.get("description"),
    purpose: formData.get("purpose"),
    isRecurring: formData.get("isRecurring") === "true",
    isChitFund: formData.get("isChitFund") === "true",
    appliesToAllMembers: formData.get("appliesToAllMembers") !== "false",
    memberIds: memberIdsRaw,
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

  if (parsed.data.isChitFund) {
    const { data: existingChit, error: chitCheckError } = await supabase
      .from("Fund")
      .select("id")
      .eq("isChitFund", true)
      .neq("id", id)
      .maybeSingle()
    if (chitCheckError) throw chitCheckError
    if (existingChit) {
      return {
        error: {
          isChitFund: ["Another fund is already marked as the chit fund."],
        },
      }
    }
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
    isChitFund: boolean
    appliesToAllMembers: boolean
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
    isChitFund: parsed.data.isChitFund ?? false,
    appliesToAllMembers: parsed.data.appliesToAllMembers ?? true,
    startDate: parsed.data.startDate ? new Date(parsed.data.startDate).toISOString() : null,
    updatedAt: now(),
  }

  const { error } = await supabase.from('Fund').update(data).eq('id', id)
  if (error) throw error

  const { error: clearError } = await supabase
    .from('MemberFund')
    .delete()
    .eq('fundId', id)
  if (clearError) throw clearError

  if (!data.appliesToAllMembers && parsed.data.memberIds.length > 0) {
    const timestamp = now()
    const rows = parsed.data.memberIds.map((memberId) => ({
      fundId: id,
      memberId,
      createdAt: timestamp,
    }))
    const { error: mfError } = await supabase.from('MemberFund').insert(rows)
    if (mfError) throw mfError
  }

  revalidatePath("/funds")
  revalidatePath("/chit-fund")
  revalidatePath("/dashboard")
  redirect("/funds")
}

export async function deleteFund(id: string, options?: { force?: boolean }) {
  await requireAdmin()

  const { data: fund, error: fundError } = await supabase
    .from('Fund')
    .select('id, isDefault, name')
    .eq('id', id)
    .maybeSingle()

  if (fundError) throw fundError
  if (!fund) return { error: "Fund not found" }
  if (fund.isDefault) return { error: "Cannot delete the default fund" }

  const { count: receiptCount, error: countError } = await supabase
    .from('Receipt')
    .select('*', { count: 'exact', head: true })
    .eq('fundId', id)

  if (countError) throw countError

  if ((receiptCount ?? 0) > 0) {
    if (!options?.force) {
      return {
        error: `This fund has ${receiptCount} receipt(s). Confirm to delete the fund and all its receipts.`,
        receiptCount: receiptCount ?? 0,
      }
    }

    const { error: delReceiptsError } = await supabase
      .from('Receipt')
      .delete()
      .eq('fundId', id)
    if (delReceiptsError) throw delReceiptsError
  }

  const { error } = await supabase.from('Fund').delete().eq('id', id)
  if (error) throw error

  revalidatePath("/funds")
  revalidatePath("/receipts")
  revalidatePath("/dashboard")
  revalidatePath("/chit-fund")
  return { success: true }
}
