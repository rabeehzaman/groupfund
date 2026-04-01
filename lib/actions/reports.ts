"use server"

import { supabase } from "@/lib/supabase"

export async function getMemberWiseReport(from?: string, to?: string, fundId?: string) {
  // Build receipt query
  let receiptQuery = supabase.from("Receipt").select("memberId, amount")
  if (fundId) receiptQuery = receiptQuery.eq("fundId", fundId)
  if (from) receiptQuery = receiptQuery.gte("date", from)
  if (to) receiptQuery = receiptQuery.lte("date", to + "T23:59:59.999Z")

  const [membersResult, receiptResult, fundResult, settingsResult] = await Promise.all([
    supabase
      .from("Member")
      .select("id, name, branch, joinDate, monthlyAmount")
      .eq("isActive", true)
      .order("name", { ascending: true }),
    receiptQuery,
    fundId
      ? supabase.from("Fund").select("*").eq("id", fundId).single()
      : Promise.resolve({ data: null, error: null }),
    supabase.from("Settings").select("*").eq("id", "default").single(),
  ])

  if (membersResult.error) throw membersResult.error
  if (receiptResult.error) throw receiptResult.error
  if (fundResult.error) throw fundResult.error
  // settings may not exist, don't throw

  const members = membersResult.data ?? []
  const receiptRows = receiptResult.data ?? []
  const fund = fundResult.data
  const settings = settingsResult.data

  // Group receipts by memberId: sum and count
  const paidMap = new Map<string, { totalPaid: number; count: number }>()
  for (const r of receiptRows) {
    const existing = paidMap.get(r.memberId)
    if (existing) {
      existing.totalPaid += r.amount
      existing.count++
    } else {
      paidMap.set(r.memberId, { totalPaid: r.amount, count: 1 })
    }
  }

  const isOpenFund = fund?.type === "OPEN"

  // Get the fund's effective start date
  const fundStartDate = fund ? new Date(fund.startDate ?? fund.createdAt) : null

  return members.map((member) => {
    const memberData = paidMap.get(member.id)
    const totalPaid = memberData?.totalPaid ?? 0
    const paymentsCount = memberData?.count ?? 0

    // For yearly funds: expected = yearlyAmount (full amount, no proration)
    // For legacy monthly funds (no yearlyAmount): fall back to old monthly calc
    const yearlyAmount = fund?.yearlyAmount ?? (fund?.amount ? fund.amount * 12 : null)

    let expectedTotal = 0
    let pendingAmount = 0

    if (isOpenFund) {
      expectedTotal = 0
      pendingAmount = 0
    } else if (yearlyAmount) {
      // Yearly amount system -- full amount expected
      expectedTotal = yearlyAmount
      pendingAmount = expectedTotal - totalPaid
    } else {
      // Legacy monthly fallback
      const joinDate = new Date(member.joinDate)
      const rangeEnd = to ? new Date(to) : new Date()
      const rangeStart = from ? new Date(from) : null

      // Use the LATER of joinDate, fundStartDate, and rangeStart
      let baseStart = joinDate
      if (fundStartDate && fundStartDate > baseStart) baseStart = fundStartDate
      const effectiveStart = rangeStart && rangeStart > baseStart ? rangeStart : baseStart

      let expectedMonths = 0
      const current = new Date(effectiveStart.getFullYear(), effectiveStart.getMonth(), 1)
      const end = new Date(rangeEnd.getFullYear(), rangeEnd.getMonth(), 1)
      while (current <= end) {
        expectedMonths++
        current.setMonth(current.getMonth() + 1)
      }

      const monthlyAmount = fund?.type === "FIXED" && fund.amount
        ? fund.amount
        : member.monthlyAmount || settings?.defaultMonthlyAmount || 1000
      expectedTotal = expectedMonths * monthlyAmount
      pendingAmount = expectedTotal - totalPaid
    }

    return {
      id: member.id,
      name: member.name,
      branch: member.branch,
      totalPaid,
      paymentsCount,
      expectedTotal,
      pendingAmount,
      isOpenFund,
    }
  })
}

export async function getOverallSummary(from?: string, to?: string, fundId?: string) {
  // Build receipt filters
  let receiptAmountQuery = supabase.from("Receipt").select("amount")
  if (fundId) receiptAmountQuery = receiptAmountQuery.eq("fundId", fundId)
  if (from) receiptAmountQuery = receiptAmountQuery.gte("date", from)
  if (to) receiptAmountQuery = receiptAmountQuery.lte("date", to + "T23:59:59.999Z")

  let paymentAmountQuery = supabase.from("Payment").select("amount")
  if (from) paymentAmountQuery = paymentAmountQuery.gte("date", from)
  if (to) paymentAmountQuery = paymentAmountQuery.lte("date", to + "T23:59:59.999Z")

  let receiptMonthQuery = supabase.from("Receipt").select("forMonth, amount")
  if (fundId) receiptMonthQuery = receiptMonthQuery.eq("fundId", fundId)
  if (from) receiptMonthQuery = receiptMonthQuery.gte("date", from)
  if (to) receiptMonthQuery = receiptMonthQuery.lte("date", to + "T23:59:59.999Z")

  let paymentListQuery = supabase.from("Payment").select("date, amount")
  if (from) paymentListQuery = paymentListQuery.gte("date", from)
  if (to) paymentListQuery = paymentListQuery.lte("date", to + "T23:59:59.999Z")

  const [memberCountResult, receiptResult, paymentResult, receiptMonthResult, paymentListResult] =
    await Promise.all([
      supabase.from("Member").select("*", { count: "exact", head: true }).eq("isActive", true),
      receiptAmountQuery,
      paymentAmountQuery,
      receiptMonthQuery,
      paymentListQuery,
    ])

  if (memberCountResult.error) throw memberCountResult.error
  if (receiptResult.error) throw receiptResult.error
  if (paymentResult.error) throw paymentResult.error
  if (receiptMonthResult.error) throw receiptMonthResult.error
  if (paymentListResult.error) throw paymentListResult.error

  const memberCount = memberCountResult.count ?? 0
  const receiptRows = receiptResult.data ?? []
  const paymentRows = paymentResult.data ?? []
  const receiptMonthRows = receiptMonthResult.data ?? []
  const payments = paymentListResult.data ?? []

  // Aggregate receipts
  const totalCollected = receiptRows.reduce((sum, r) => sum + r.amount, 0)
  const totalReceipts = receiptRows.length

  // Aggregate payments
  const totalExpenses = paymentRows.reduce((sum, p) => sum + p.amount, 0)
  const totalPayments = paymentRows.length

  // Group receipts by forMonth
  const receiptsByMonth = new Map<string, { amount: number; count: number }>()
  for (const r of receiptMonthRows) {
    const existing = receiptsByMonth.get(r.forMonth)
    if (existing) {
      existing.amount += r.amount
      existing.count++
    } else {
      receiptsByMonth.set(r.forMonth, { amount: r.amount, count: 1 })
    }
  }

  // Build monthly expenses map keyed by YYYY-MM
  const expensesByMonth: Record<string, { amount: number; count: number }> = {}
  for (const p of payments) {
    const d = new Date(p.date)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    if (!expensesByMonth[key]) expensesByMonth[key] = { amount: 0, count: 0 }
    expensesByMonth[key].amount += p.amount
    expensesByMonth[key].count++
  }

  // Merge all months from both collections and expenses
  const allMonths = new Set<string>()
  receiptsByMonth.forEach((_, m) => { allMonths.add(m) })
  Object.keys(expensesByMonth).forEach((m) => allMonths.add(m))
  const sortedMonths = Array.from(allMonths).sort()

  return {
    totalMembers: memberCount,
    totalCollected,
    totalExpenses,
    netBalance: totalCollected - totalExpenses,
    totalReceipts,
    totalPayments,
    monthlyBreakdown: sortedMonths.map((month) => {
      const receipt = receiptsByMonth.get(month)
      const expense = expensesByMonth[month]
      const cashIn = receipt?.amount || 0
      const cashOut = expense?.amount || 0
      return {
        month,
        cashIn,
        cashOut,
        net: cashIn - cashOut,
        receiptCount: receipt?.count || 0,
        paymentCount: expense?.count || 0,
      }
    }),
  }
}

export async function getTransactionTimeline(from?: string, to?: string, fundId?: string) {
  // Fetch receipts with member and fund names
  let receiptQuery = supabase
    .from("Receipt")
    .select("id, date, amount, forMonth, narration, member:Member(name), fund:Fund(name)")
    .order("date", { ascending: false })
    .limit(50)
  if (fundId) receiptQuery = receiptQuery.eq("fundId", fundId)
  if (from) receiptQuery = receiptQuery.gte("date", from)
  if (to) receiptQuery = receiptQuery.lte("date", to + "T23:59:59.999Z")

  let paymentQuery = supabase
    .from("Payment")
    .select("id, date, amount, purpose, paidTo, narration")
    .order("date", { ascending: false })
    .limit(50)
  if (from) paymentQuery = paymentQuery.gte("date", from)
  if (to) paymentQuery = paymentQuery.lte("date", to + "T23:59:59.999Z")

  const [receiptResult, paymentResult] = await Promise.all([receiptQuery, paymentQuery])
  if (receiptResult.error) throw receiptResult.error
  if (paymentResult.error) throw paymentResult.error

  const receipts = receiptResult.data ?? []
  const payments = paymentResult.data ?? []

  const timeline = [
    ...receipts.map((r: any) => ({
      id: r.id,
      type: "receipt" as const,
      date: r.date,
      amount: r.amount,
      description: `${r.member?.name} - ${r.fund?.name}${r.forMonth ? ` (${r.forMonth})` : ""}`,
      narration: r.narration,
    })),
    ...payments.map((p: any) => ({
      id: p.id,
      type: "payment" as const,
      date: p.date,
      amount: p.amount,
      description: `${p.purpose} - ${p.paidTo}`,
      narration: p.narration,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return timeline.slice(0, 50)
}
