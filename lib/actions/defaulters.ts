"use server"

import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth-utils"

export type Defaulter = {
  id: string
  name: string
  branch: string
  pendingAmount: number
  severity: "yellow" | "orange" | "red"
  totalPaid: number
  expectedTotal: number
}

function getSeverity(totalPaid: number, expectedTotal: number): "yellow" | "orange" | "red" {
  if (expectedTotal <= 0) return "yellow"
  const paidPercent = (totalPaid / expectedTotal) * 100
  if (paidPercent < 25) return "red"
  if (paidPercent < 50) return "orange"
  return "yellow"
}

export async function getDefaulters(fundId?: string): Promise<Defaulter[]> {
  await requireAuth()

  // Get the target fund (or default fund)
  let fund = fundId
    ? await db.fund.findUnique({ where: { id: fundId } })
    : await db.fund.findFirst({ where: { isDefault: true } })

  if (!fund) {
    fund = await db.fund.findFirst({ where: { isActive: true } })
  }
  if (!fund || fund.type === "OPEN") return []

  const fundStartDate = new Date(fund.startDate ?? fund.createdAt)
  const yearlyAmount = fund.yearlyAmount ?? (fund.amount ? fund.amount * 12 : 0)
  if (yearlyAmount <= 0) return []

  // Use groupBy for aggregates instead of loading all receipts into memory
  const [members, receiptTotals] = await Promise.all([
    db.member.findMany({
      where: { isActive: true },
      select: { id: true, name: true, branch: true, joinDate: true },
    }),
    db.receipt.groupBy({
      by: ["memberId"],
      where: { fundId: fund.id },
      _sum: { amount: true },
    }),
  ])

  const paidMap = new Map(
    receiptTotals.map((r) => [r.memberId, r._sum.amount ?? 0])
  )

  return members
    .map((member) => {
      const joinDate = new Date(member.joinDate)
      // Only count from the later of joinDate or fundStartDate
      if (joinDate > new Date() || fundStartDate > new Date()) {
        return null
      }

      const totalPaid = paidMap.get(member.id) ?? 0
      const expectedTotal = yearlyAmount
      const pendingAmount = expectedTotal - totalPaid

      if (pendingAmount <= 0) return null

      return {
        id: member.id,
        name: member.name,
        branch: member.branch,
        pendingAmount,
        totalPaid,
        expectedTotal,
        severity: getSeverity(totalPaid, expectedTotal),
      }
    })
    .filter((m): m is Defaulter => m !== null)
    .sort((a, b) => b.pendingAmount - a.pendingAmount)
}

export async function getDefaulterStatus(memberId: string, fundId?: string) {
  let fund = fundId
    ? await db.fund.findUnique({ where: { id: fundId } })
    : await db.fund.findFirst({ where: { isDefault: true } })

  if (!fund) {
    fund = await db.fund.findFirst({ where: { isActive: true } })
  }
  if (!fund || fund.type === "OPEN") return null

  const yearlyAmount = fund.yearlyAmount ?? (fund.amount ? fund.amount * 12 : 0)
  if (yearlyAmount <= 0) return null

  const member = await db.member.findUnique({
    where: { id: memberId },
    include: {
      receipts: {
        where: { fundId: fund.id },
        select: { amount: true },
      },
    },
  })

  if (!member) return null

  const totalPaid = member.receipts.reduce((sum, r) => sum + r.amount, 0)
  const pendingAmount = yearlyAmount - totalPaid

  if (pendingAmount <= 0) return null

  return {
    pendingAmount,
    severity: getSeverity(totalPaid, yearlyAmount),
  }
}
