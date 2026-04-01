"use server"

import { supabase } from "@/lib/supabase"
import { formatCurrency } from "@/lib/format"
import { requireAdmin } from "@/lib/auth-utils"

export async function getPendingMembers(fundId?: string) {
  await requireAdmin()

  // Get the target fund
  let fund: any = null
  if (fundId) {
    const { data, error } = await supabase.from("Fund").select("*").eq("id", fundId).single()
    if (error) throw error
    fund = data
  } else {
    const { data } = await supabase.from("Fund").select("*").eq("isDefault", true).limit(1).single()
    fund = data
  }

  if (!fund) {
    const { data } = await supabase.from("Fund").select("*").eq("isActive", true).limit(1).single()
    fund = data
  }
  if (!fund) return { pending: [], total: 0, paid: 0, fundName: "" }

  const yearlyAmount = fund.yearlyAmount ?? (fund.amount ? fund.amount * 12 : 0)

  // Fetch members and receipt totals in parallel
  const [membersResult, receiptResult] = await Promise.all([
    supabase
      .from("Member")
      .select("id, name, branch")
      .eq("isActive", true)
      .order("name", { ascending: true }),
    supabase
      .from("Receipt")
      .select("memberId, amount")
      .eq("fundId", fund.id),
  ])

  if (membersResult.error) throw membersResult.error
  if (receiptResult.error) throw receiptResult.error

  const members = membersResult.data ?? []
  const receiptRows = receiptResult.data ?? []

  // Group receipts by memberId
  const paidMap = new Map<string, number>()
  for (const r of receiptRows) {
    paidMap.set(r.memberId, (paidMap.get(r.memberId) ?? 0) + r.amount)
  }

  const pending = members
    .map((m) => {
      const totalPaid = paidMap.get(m.id) ?? 0
      const pendingAmount = yearlyAmount - totalPaid
      return {
        id: m.id,
        name: m.name,
        branch: m.branch,
        totalPaid,
        pendingAmount,
        yearlyAmount,
      }
    })
    .filter((m) => m.pendingAmount > 0)

  const paidCount = members.length - pending.length

  return {
    pending,
    total: members.length,
    paid: paidCount,
    fundName: fund.name,
  }
}

export async function generateReminderText(fundId?: string) {
  await requireAdmin()
  const { pending, fundName } = await getPendingMembers(fundId)

  const lines = [
    `*Payment Reminder - ${fundName}*`,
    "",
    `${pending.length} member${pending.length !== 1 ? "s" : ""} have pending payments:`,
    "",
    ...pending.map(
      (m, i) =>
        `${i + 1}. ${m.name}${m.branch ? ` (${m.branch})` : ""} - Pending: ${formatCurrency(m.pendingAmount)}`
    ),
    "",
    "Please make your contribution at the earliest. Thank you!",
  ]
  return lines.join("\n")
}
