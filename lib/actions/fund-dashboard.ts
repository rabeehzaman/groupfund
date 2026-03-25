"use server"

import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth-utils"

export async function getFundDashboard(fundId: string) {
  await requireAuth()

  const fund = await db.fund.findUnique({
    where: { id: fundId },
    include: { _count: { select: { receipts: true } } },
  })
  if (!fund) return null

  const [totalResult, uniqueContributors, recentReceipts] = await Promise.all([
    db.receipt.aggregate({
      where: { fundId },
      _sum: { amount: true },
    }),
    db.receipt.groupBy({
      by: ["memberId"],
      where: { fundId },
    }),
    db.receipt.findMany({
      where: { fundId },
      orderBy: { date: "desc" },
      take: 10,
      include: {
        member: { select: { name: true, branch: true } },
      },
    }),
  ])

  const collected = totalResult._sum.amount || 0

  if (fund.type === "FIXED") {
    const activeMembers = await db.member.count({ where: { isActive: true } })
    const yearlyAmount = fund.yearlyAmount ?? (fund.amount ? fund.amount * 12 : 0)
    const expected = activeMembers * yearlyAmount
    const progress = expected > 0 ? (collected / expected) * 100 : 0

    return {
      fund,
      collected,
      expected,
      progress: Math.min(progress, 100),
      type: "FIXED" as const,
      activeMembers,
      yearlyAmount,
      receiptCount: fund._count.receipts,
      uniqueContributors: uniqueContributors.length,
      recentReceipts,
    }
  } else {
    const goal = fund.goalAmount || 0
    const progress = goal > 0 ? (collected / goal) * 100 : 0

    return {
      fund,
      collected,
      goal,
      progress: goal > 0 ? Math.min(progress, 100) : 0,
      type: "OPEN" as const,
      receiptCount: fund._count.receipts,
      uniqueContributors: uniqueContributors.length,
      recentReceipts,
    }
  }
}
