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

export async function getDashboardStats(from?: string, to?: string) {
  const dateFilter = buildDateFilter(from, to)
  const [members, receipts, payments] = await Promise.all([
    db.member.count({ where: { isActive: true } }),
    db.receipt.aggregate({ where: dateFilter, _sum: { amount: true } }),
    db.payment.aggregate({ where: dateFilter, _sum: { amount: true } }),
  ])

  const totalCollected = receipts._sum.amount || 0
  const totalExpenses = payments._sum.amount || 0
  const netBalance = totalCollected - totalExpenses

  return {
    totalMembers: members,
    totalCollected,
    totalExpenses,
    netBalance,
  }
}

export async function getCollectionTrend(from?: string, to?: string) {
  const dateFilter = buildDateFilter(from, to)
  const receipts = await db.receipt.groupBy({
    by: ["forMonth"],
    where: dateFilter,
    _sum: { amount: true },
    orderBy: { forMonth: "asc" },
  })

  return receipts.map((r) => ({
    month: r.forMonth,
    amount: r._sum.amount || 0,
  }))
}

export async function getRecentActivity(from?: string, to?: string) {
  const dateFilter = buildDateFilter(from, to)
  const [recentReceipts, recentPayments] = await Promise.all([
    db.receipt.findMany({
      where: dateFilter,
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        member: { select: { name: true } },
        fund: { select: { name: true } },
      },
    }),
    db.payment.findMany({
      where: dateFilter,
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ])

  const activities = [
    ...recentReceipts.map((r) => ({
      id: r.id,
      type: "receipt" as const,
      description: `${r.member.name} - ${r.fund.name}`,
      date: r.createdAt,
      amount: r.amount,
    })),
    ...recentPayments.map((p) => ({
      id: p.id,
      type: "payment" as const,
      description: `${p.purpose} - ${p.paidTo}`,
      date: p.createdAt,
      amount: -p.amount,
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime())

  return activities.slice(0, 8)
}

export async function getCollectionRate() {
  const [totalActive, defaultFund] = await Promise.all([
    db.member.count({ where: { isActive: true } }),
    db.fund.findFirst({ where: { isDefault: true } }),
  ])

  if (!defaultFund) {
    return { paidCount: 0, totalActive, rate: 0 }
  }

  const yearlyAmount = defaultFund.yearlyAmount ?? (defaultFund.amount ? defaultFund.amount * 12 : 0)

  if (yearlyAmount <= 0) {
    return { paidCount: 0, totalActive, rate: 0 }
  }

  // Count members who have fully paid their yearly amount for this fund
  // Use groupBy to aggregate at database level instead of loading all receipts into memory
  const receiptTotals = await db.receipt.groupBy({
    by: ["memberId"],
    where: { fundId: defaultFund.id },
    _sum: { amount: true },
  })

  const paidCount = receiptTotals.filter(
    (r) => (r._sum.amount ?? 0) >= yearlyAmount
  ).length

  const rate = totalActive > 0 ? (paidCount / totalActive) * 100 : 0
  return { paidCount, totalActive, rate }
}
