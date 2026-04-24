"use server"

import { auth } from "@/lib/auth"
import { supabase, generateId, now } from "@/lib/supabase"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { requireAdmin } from "@/lib/auth-utils"
import { receiptSchema } from "@/lib/validations/receipt"

export async function getChitFund() {
  const { data, error } = await supabase
    .from("Fund")
    .select("*")
    .eq("isChitFund", true)
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function getChitFundSummary() {
  const chitFund = await getChitFund()
  if (!chitFund) {
    return {
      fund: null,
      totalCollected: 0,
      contributorCount: 0,
      receiptCount: 0,
    }
  }

  const { data: rows, error } = await supabase
    .from("Receipt")
    .select("amount, memberId")
    .eq("fundId", chitFund.id)

  if (error) throw error

  const contributors = new Set<string>()
  let totalCollected = 0
  for (const r of rows ?? []) {
    totalCollected += r.amount
    contributors.add(r.memberId)
  }

  return {
    fund: chitFund,
    totalCollected,
    contributorCount: contributors.size,
    receiptCount: (rows ?? []).length,
  }
}

export async function getChitFundMemberTotals() {
  const chitFund = await getChitFund()
  if (!chitFund) return { fund: null, rows: [] }

  const [membersResult, receiptsResult] = await Promise.all([
    supabase.from("Member").select("id, name, branch, photoUrl").order("name"),
    supabase
      .from("Receipt")
      .select("memberId, amount")
      .eq("fundId", chitFund.id),
  ])

  if (membersResult.error) throw membersResult.error
  if (receiptsResult.error) throw receiptsResult.error

  const totals = new Map<string, { total: number; count: number }>()
  for (const r of receiptsResult.data ?? []) {
    const entry = totals.get(r.memberId) ?? { total: 0, count: 0 }
    entry.total += r.amount
    entry.count += 1
    totals.set(r.memberId, entry)
  }

  const rows = (membersResult.data ?? []).map((m: any) => {
    const t = totals.get(m.id) ?? { total: 0, count: 0 }
    return { ...m, total: t.total, count: t.count }
  })

  return { fund: chitFund, rows }
}

export async function getChitFundRecentContributions(limit = 20) {
  const chitFund = await getChitFund()
  if (!chitFund) return []

  const { data, error } = await supabase
    .from("Receipt")
    .select("id, amount, date, narration, createdAt, Member(id, name, branch)")
    .eq("fundId", chitFund.id)
    .order("date", { ascending: false })
    .limit(limit)

  if (error) throw error

  return (data ?? []).map((row: any) => {
    const { Member, ...rest } = row
    return { ...rest, member: Member }
  })
}

export async function getMyChitFundContributions() {
  const session = await auth()
  if (!session?.user?.memberId) redirect("/login")
  const memberId = session.user.memberId

  const chitFund = await getChitFund()
  if (!chitFund) {
    return { fund: null, total: 0, contributions: [] }
  }

  const { data, error } = await supabase
    .from("Receipt")
    .select("id, amount, date, narration, createdAt")
    .eq("fundId", chitFund.id)
    .eq("memberId", memberId)
    .order("date", { ascending: false })

  if (error) throw error

  const contributions = data ?? []
  const total = contributions.reduce((sum: number, r: any) => sum + r.amount, 0)

  return { fund: chitFund, total, contributions }
}

export async function getMembersForChitSelect() {
  await requireAdmin()
  const { data, error } = await supabase
    .from("Member")
    .select("id, name, branch")
    .eq("isActive", true)
    .order("name")
  if (error) throw error
  return data ?? []
}

export async function createChitContribution(
  _prevState: unknown,
  formData: FormData,
) {
  await requireAdmin()
  const chitFund = await getChitFund()
  if (!chitFund) {
    return {
      error: {
        fundId: [
          "No chit fund is configured. Mark a fund as the chit fund first.",
        ],
      },
    }
  }

  const dateRaw = formData.get("date")
  const parsed = receiptSchema.safeParse({
    date: dateRaw && String(dateRaw).trim() !== "" ? dateRaw : new Date(),
    amount: formData.get("amount"),
    narration: formData.get("narration") ?? "",
    memberId: formData.get("memberId"),
    fundId: chitFund.id,
  })

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const { error } = await supabase.from("Receipt").insert({
    id: generateId(),
    ...parsed.data,
    forMonth: null,
    createdAt: now(),
    updatedAt: now(),
  })

  if (error) throw error

  revalidatePath("/chit-fund")
  revalidatePath("/dashboard")
  revalidatePath(`/members/${parsed.data.memberId}`)
  revalidatePath("/portal/chit-fund")
  return { success: true }
}
