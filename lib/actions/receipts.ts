"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { supabase, generateId, now } from "@/lib/supabase"
import { receiptSchema } from "@/lib/validations/receipt"
import { requireAdmin } from "@/lib/auth-utils"

export async function getReceipts(from?: string, to?: string, fundId?: string) {
  let query = supabase
    .from('Receipt')
    .select('*, Member(name, branch), Fund(name)')
    .order('date', { ascending: false })

  if (from) query = query.gte('date', new Date(from).toISOString())
  if (to) query = query.lte('date', new Date(to + "T23:59:59.999Z").toISOString())
  if (fundId) query = query.eq('fundId', fundId)

  const { data, error } = await query

  if (error) throw error

  return (data ?? []).map((row: any) => {
    const { Member, Fund, ...rest } = row
    return { ...rest, member: Member, fund: Fund }
  })
}

export async function getReceipt(id: string) {
  const { data, error } = await supabase
    .from('Receipt')
    .select('*, Member(name), Fund(name)')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const { Member, Fund, ...rest } = data
  return { ...rest, member: Member, fund: Fund }
}

export async function createReceipt(_prevState: unknown, formData: FormData) {
  await requireAdmin()
  let fundId = formData.get("fundId") as string | null
  if (!fundId) {
    const { data: defaultFund, error: fundError } = await supabase
      .from('Fund')
      .select('*')
      .eq('isDefault', true)
      .limit(1)
      .maybeSingle()

    if (fundError) throw fundError
    if (!defaultFund) return { error: { fundId: ["No default fund found. Please create a fund first."] } }
    fundId = defaultFund.id
  }

  const forMonth = formData.get("forMonth") as string | null
  const parsed = receiptSchema.safeParse({
    date: formData.get("date"),
    amount: formData.get("amount"),
    forMonth: forMonth || undefined,
    narration: formData.get("narration"),
    memberId: formData.get("memberId"),
    fundId,
  })

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const { error } = await supabase
    .from('Receipt')
    .insert({
      id: generateId(),
      ...parsed.data,
      forMonth: parsed.data.forMonth || null,
      createdAt: now(),
      updatedAt: now(),
    })

  if (error) throw error

  revalidatePath("/receipts")
  revalidatePath("/dashboard")
  revalidatePath(`/members/${parsed.data.memberId}`)
  redirect("/receipts")
}

export async function updateReceipt(id: string, _prevState: unknown, formData: FormData) {
  await requireAdmin()
  let fundId = formData.get("fundId") as string | null
  if (!fundId) {
    const { data: existing, error: existingError } = await supabase
      .from('Receipt')
      .select('fundId')
      .eq('id', id)
      .maybeSingle()

    if (existingError) throw existingError
    fundId = existing?.fundId ?? null

    if (!fundId) {
      const { data: defaultFund, error: fundError } = await supabase
        .from('Fund')
        .select('*')
        .eq('isDefault', true)
        .limit(1)
        .maybeSingle()

      if (fundError) throw fundError
      if (!defaultFund) return { error: { fundId: ["No default fund found."] } }
      fundId = defaultFund.id
    }
  }

  const forMonth = formData.get("forMonth") as string | null
  const parsed = receiptSchema.safeParse({
    date: formData.get("date"),
    amount: formData.get("amount"),
    forMonth: forMonth || undefined,
    narration: formData.get("narration"),
    memberId: formData.get("memberId"),
    fundId,
  })

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const { error } = await supabase
    .from('Receipt')
    .update({
      ...parsed.data,
      forMonth: parsed.data.forMonth || null,
      updatedAt: now(),
    })
    .eq('id', id)

  if (error) throw error

  revalidatePath("/receipts")
  revalidatePath("/dashboard")
  redirect("/receipts")
}

export async function deleteReceipt(id: string) {
  await requireAdmin()

  const { error } = await supabase
    .from('Receipt')
    .delete()
    .eq('id', id)

  if (error) throw error

  revalidatePath("/receipts")
  revalidatePath("/dashboard")
  return { success: true }
}

export async function updateReceiptStatus(id: string, status: "VERIFIED" | "REJECTED") {
  await requireAdmin()

  const { error } = await supabase
    .from('Receipt')
    .update({ status, updatedAt: now() })
    .eq('id', id)

  if (error) throw error

  revalidatePath("/receipts")
  return { success: true }
}

export async function createBatchReceipts(data: {
  date: string
  forMonth?: string
  fundId?: string
  entries: { memberId: string; amount: number; narration: string }[]
}) {
  let fundId = data.fundId
  if (!fundId) {
    const { data: defaultFund, error: fundError } = await supabase
      .from('Fund')
      .select('*')
      .eq('isDefault', true)
      .limit(1)
      .maybeSingle()

    if (fundError) throw fundError
    if (!defaultFund) throw new Error("No default fund found. Please create a fund first.")
    fundId = defaultFund.id
  }

  const timestamp = now()
  const receipts = data.entries.map((entry) => ({
    id: generateId(),
    date: new Date(data.date).toISOString(),
    forMonth: data.forMonth || null,
    fundId,
    amount: entry.amount,
    narration: entry.narration,
    memberId: entry.memberId,
    createdAt: timestamp,
    updatedAt: timestamp,
  }))

  const { error } = await supabase
    .from('Receipt')
    .insert(receipts)

  if (error) throw error

  revalidatePath("/receipts")
  revalidatePath("/dashboard")
  revalidatePath("/members")
  return { success: true, count: receipts.length }
}
