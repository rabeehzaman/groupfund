"use server"

import { db } from "@/lib/db"
import { formatCurrency } from "@/lib/format"
import { requireAdmin } from "@/lib/auth-utils"

export async function getPendingMembers(fundId?: string) {
  await requireAdmin()

  // Get the target fund
  let fund = fundId
    ? await db.fund.findUnique({ where: { id: fundId } })
    : await db.fund.findFirst({ where: { isDefault: true } })

  if (!fund) {
    fund = await db.fund.findFirst({ where: { isActive: true } })
  }
  if (!fund) return { pending: [], total: 0, paid: 0, fundName: "" }

  const yearlyAmount = fund.yearlyAmount ?? (fund.amount ? fund.amount * 12 : 0)

  const members = await db.member.findMany({
    where: { isActive: true },
    include: {
      receipts: {
        where: { fundId: fund.id },
        select: { amount: true },
      },
    },
    orderBy: { name: "asc" },
  })

  const pending = members
    .map((m) => {
      const totalPaid = m.receipts.reduce((sum, r) => sum + r.amount, 0)
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
