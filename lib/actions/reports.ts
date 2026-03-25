"use server"

import { db } from "@/lib/db"

function buildDateFilter(from?: string, to?: string) {
  const where: { date?: { gte?: Date; lte?: Date } } = {}
  if (from || to) {
    where.date = {}
    if (from) where.date.gte = new Date(from)
    if (to) where.date.lte = new Date(to + "T23:59:59.999Z")
  }
  return where
}

export async function getMemberWiseReport(from?: string, to?: string, fundId?: string) {
  const receiptWhere: { fundId?: string; date?: { gte?: Date; lte?: Date } } = {}
  if (fundId) receiptWhere.fundId = fundId
  if (from || to) {
    receiptWhere.date = {}
    if (from) receiptWhere.date.gte = new Date(from)
    if (to) receiptWhere.date.lte = new Date(to + "T23:59:59.999Z")
  }

  const [members, fund, settings] = await Promise.all([
    db.member.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      include: {
        receipts: { where: receiptWhere },
      },
    }),
    fundId ? db.fund.findUnique({ where: { id: fundId } }) : null,
    db.settings.findUnique({ where: { id: "default" } }),
  ])

  const isOpenFund = fund?.type === "OPEN"

  // Get the fund's effective start date
  const fundStartDate = fund ? new Date(fund.startDate ?? fund.createdAt) : null

  return members.map((member) => {
    const totalPaid = member.receipts.reduce((sum, r) => sum + r.amount, 0)
    const paymentsCount = member.receipts.length

    // For yearly funds: expected = yearlyAmount (full amount, no proration)
    // For legacy monthly funds (no yearlyAmount): fall back to old monthly calc
    const yearlyAmount = fund?.yearlyAmount ?? (fund?.amount ? fund.amount * 12 : null)

    let expectedTotal = 0
    let pendingAmount = 0

    if (isOpenFund) {
      expectedTotal = 0
      pendingAmount = 0
    } else if (yearlyAmount) {
      // Yearly amount system — full amount expected
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
  const dateFilter = buildDateFilter(from, to)
  const receiptWhere = { ...dateFilter, ...(fundId ? { fundId } : {}) }
  const [memberCount, receiptAgg, paymentAgg, receiptsByMonth, payments] =
    await Promise.all([
      db.member.count({ where: { isActive: true } }),
      db.receipt.aggregate({ where: receiptWhere, _sum: { amount: true }, _count: true }),
      db.payment.aggregate({ where: dateFilter, _sum: { amount: true }, _count: true }),
      db.receipt.groupBy({
        by: ["forMonth"],
        where: receiptWhere,
        _sum: { amount: true },
        _count: true,
        orderBy: { forMonth: "asc" },
      }),
      db.payment.findMany({
        where: dateFilter,
        select: { date: true, amount: true },
      }),
    ])

  // Build monthly expenses map keyed by YYYY-MM
  const expensesByMonth: Record<string, { amount: number; count: number }> = {}
  for (const p of payments) {
    const key = `${p.date.getFullYear()}-${String(p.date.getMonth() + 1).padStart(2, "0")}`
    if (!expensesByMonth[key]) expensesByMonth[key] = { amount: 0, count: 0 }
    expensesByMonth[key].amount += p.amount
    expensesByMonth[key].count++
  }

  // Merge all months from both collections and expenses
  const allMonths = new Set<string>()
  receiptsByMonth.forEach((m) => { if (m.forMonth) allMonths.add(m.forMonth) })
  Object.keys(expensesByMonth).forEach((m) => allMonths.add(m))
  const sortedMonths = Array.from(allMonths).sort()

  const totalCollected = receiptAgg._sum.amount || 0
  const totalExpenses = paymentAgg._sum.amount || 0

  return {
    totalMembers: memberCount,
    totalCollected,
    totalExpenses,
    netBalance: totalCollected - totalExpenses,
    totalReceipts: receiptAgg._count,
    totalPayments: paymentAgg._count,
    monthlyBreakdown: sortedMonths.map((month) => {
      const receipt = receiptsByMonth.find((r) => r.forMonth === month)
      const expense = expensesByMonth[month]
      const cashIn = receipt?._sum.amount || 0
      const cashOut = expense?.amount || 0
      return {
        month,
        cashIn,
        cashOut,
        net: cashIn - cashOut,
        receiptCount: receipt?._count || 0,
        paymentCount: expense?.count || 0,
      }
    }),
  }
}

export async function getTransactionTimeline(from?: string, to?: string, fundId?: string) {
  const dateFilter = buildDateFilter(from, to)
  const receiptWhere = { ...dateFilter, ...(fundId ? { fundId } : {}) }
  const [receipts, payments] = await Promise.all([
    db.receipt.findMany({
      where: receiptWhere,
      orderBy: { date: "desc" },
      include: {
        member: { select: { name: true } },
        fund: { select: { name: true } },
      },
    }),
    db.payment.findMany({
      where: dateFilter,
      orderBy: { date: "desc" },
    }),
  ])

  const timeline = [
    ...receipts.map((r) => ({
      id: r.id,
      type: "receipt" as const,
      date: r.date,
      amount: r.amount,
      description: `${r.member.name} - ${r.fund.name}${r.forMonth ? ` (${r.forMonth})` : ""}`,
      narration: r.narration,
    })),
    ...payments.map((p) => ({
      id: p.id,
      type: "payment" as const,
      date: p.date,
      amount: p.amount,
      description: `${p.purpose} - ${p.paidTo}`,
      narration: p.narration,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return timeline
}
