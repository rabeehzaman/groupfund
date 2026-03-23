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

  const [members, fund] = await Promise.all([
    db.member.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      include: {
        receipts: { where: receiptWhere },
      },
    }),
    fundId ? db.fund.findUnique({ where: { id: fundId } }) : null,
  ])

  const settings = await db.settings.findUnique({ where: { id: "default" } })
  const isOpenFund = fund?.type === "OPEN"

  // Determine the date range for expected months calculation
  const rangeEnd = to ? new Date(to) : new Date()
  const rangeStart = from ? new Date(from) : null

  return members.map((member) => {
    const totalPaid = member.receipts.reduce((sum, r) => sum + r.amount, 0)
    const monthsPaid = new Set(member.receipts.map((r) => r.forMonth)).size

    // Calculate expected months within the selected range
    const joinDate = new Date(member.joinDate)
    const effectiveStart = rangeStart && rangeStart > joinDate ? rangeStart : joinDate
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
    const expectedTotal = isOpenFund ? 0 : expectedMonths * monthlyAmount
    const pendingAmount = isOpenFund ? 0 : expectedTotal - totalPaid
    const pendingMonths = isOpenFund ? 0 : expectedMonths - monthsPaid

    return {
      id: member.id,
      name: member.name,
      branch: member.branch,
      totalPaid,
      monthsPaid,
      expectedMonths,
      pendingMonths,
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
  receiptsByMonth.forEach((m) => allMonths.add(m.forMonth))
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
      description: `${r.member.name} - ${r.fund.name} (${r.forMonth})`,
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
