"use server"

import { supabase } from "@/lib/supabase"

function buildDateFilters(query: ReturnType<ReturnType<typeof supabase.from>["select"]>, from?: string, to?: string) {
  if (from) query = query.gte("date", from)
  if (to) query = query.lte("date", to + "T23:59:59.999Z")
  return query
}

export async function getDashboardStats(from?: string, to?: string) {
  // Count active members
  const { count: totalMembers, error: membersError } = await supabase
    .from("Member")
    .select("*", { count: "exact", head: true })
    .eq("isActive", true)
  if (membersError) throw membersError

  // Fetch receipt amounts
  let receiptQuery = supabase.from("Receipt").select("amount")
  if (from) receiptQuery = receiptQuery.gte("date", from)
  if (to) receiptQuery = receiptQuery.lte("date", to + "T23:59:59.999Z")
  const { data: receiptRows, error: receiptError } = await receiptQuery
  if (receiptError) throw receiptError

  // Fetch payment amounts
  let paymentQuery = supabase.from("Payment").select("amount")
  if (from) paymentQuery = paymentQuery.gte("date", from)
  if (to) paymentQuery = paymentQuery.lte("date", to + "T23:59:59.999Z")
  const { data: paymentRows, error: paymentError } = await paymentQuery
  if (paymentError) throw paymentError

  const totalCollected = (receiptRows ?? []).reduce((sum, r) => sum + r.amount, 0)
  const totalExpenses = (paymentRows ?? []).reduce((sum, p) => sum + p.amount, 0)
  const netBalance = totalCollected - totalExpenses

  return {
    totalMembers: totalMembers ?? 0,
    totalCollected,
    totalExpenses,
    netBalance,
  }
}

export async function getCollectionTrend(from?: string, to?: string) {
  let query = supabase.from("Receipt").select("forMonth, amount")
  if (from) query = query.gte("date", from)
  if (to) query = query.lte("date", to + "T23:59:59.999Z")
  const { data: rows, error } = await query
  if (error) throw error

  const monthTotals = new Map<string, number>()
  for (const r of rows ?? []) {
    monthTotals.set(r.forMonth, (monthTotals.get(r.forMonth) ?? 0) + r.amount)
  }

  return Array.from(monthTotals.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, amount]) => ({ month, amount }))
}

export async function getRecentActivity(from?: string, to?: string) {
  // Fetch recent receipts with member and fund names
  let receiptQuery = supabase
    .from("Receipt")
    .select("id, createdAt, amount, member:Member(name), fund:Fund(name)")
    .order("createdAt", { ascending: false })
    .limit(5)
  if (from) receiptQuery = receiptQuery.gte("date", from)
  if (to) receiptQuery = receiptQuery.lte("date", to + "T23:59:59.999Z")
  const { data: recentReceipts, error: receiptError } = await receiptQuery
  if (receiptError) throw receiptError

  // Fetch recent payments
  let paymentQuery = supabase
    .from("Payment")
    .select("id, createdAt, amount, purpose, paidTo")
    .order("createdAt", { ascending: false })
    .limit(5)
  if (from) paymentQuery = paymentQuery.gte("date", from)
  if (to) paymentQuery = paymentQuery.lte("date", to + "T23:59:59.999Z")
  const { data: recentPayments, error: paymentError } = await paymentQuery
  if (paymentError) throw paymentError

  const activities = [
    ...(recentReceipts ?? []).map((r: any) => ({
      id: r.id,
      type: "receipt" as const,
      description: `${r.member?.name} - ${r.fund?.name}`,
      date: r.createdAt,
      amount: r.amount,
    })),
    ...(recentPayments ?? []).map((p: any) => ({
      id: p.id,
      type: "payment" as const,
      description: `${p.purpose} - ${p.paidTo}`,
      date: p.createdAt,
      amount: -p.amount,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return activities.slice(0, 8)
}

export async function getCollectionRate() {
  const [memberResult, fundResult] = await Promise.all([
    supabase.from("Member").select("*", { count: "exact", head: true }).eq("isActive", true),
    supabase.from("Fund").select("*").eq("isDefault", true).limit(1).single(),
  ])
  if (memberResult.error) throw memberResult.error
  const totalActive = memberResult.count ?? 0

  const defaultFund = fundResult.data
  if (!defaultFund) {
    return { paidCount: 0, totalActive, rate: 0 }
  }

  const yearlyAmount = defaultFund.yearlyAmount ?? (defaultFund.amount ? defaultFund.amount * 12 : 0)

  if (yearlyAmount <= 0) {
    return { paidCount: 0, totalActive, rate: 0 }
  }

  // Fetch receipt totals grouped by memberId
  const { data: rows, error } = await supabase
    .from("Receipt")
    .select("memberId, amount")
    .eq("fundId", defaultFund.id)
  if (error) throw error

  const totals = new Map<string, number>()
  for (const r of rows ?? []) {
    totals.set(r.memberId, (totals.get(r.memberId) ?? 0) + r.amount)
  }

  const paidCount = Array.from(totals.values()).filter((sum) => sum >= yearlyAmount).length

  const rate = totalActive > 0 ? (paidCount / totalActive) * 100 : 0
  return { paidCount, totalActive, rate }
}
