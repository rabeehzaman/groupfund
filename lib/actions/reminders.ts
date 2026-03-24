"use server"

import { db } from "@/lib/db"
import { getCurrentMonthKey, formatMonthYear } from "@/lib/format"
import { requireAdmin } from "@/lib/auth-utils"

export async function getPendingMembers(forMonth?: string) {
  await requireAdmin()
  const month = forMonth || getCurrentMonthKey()

  const members = await db.member.findMany({
    where: { isActive: true },
    include: {
      receipts: { where: { forMonth: month } },
    },
    orderBy: { name: "asc" },
  })

  return {
    month,
    pending: members
      .filter((m) => m.receipts.length === 0)
      .map((m) => ({
        id: m.id,
        name: m.name,
        branch: m.branch,
        monthlyAmount: m.monthlyAmount,
      })),
    total: members.length,
    paid: members.filter((m) => m.receipts.length > 0).length,
  }
}

export async function generateReminderText(forMonth: string) {
  await requireAdmin()
  const { pending } = await getPendingMembers(forMonth)
  const monthLabel = formatMonthYear(forMonth)

  const lines = [
    `*Payment Reminder - ${monthLabel}*`,
    "",
    `${pending.length} member${pending.length !== 1 ? "s" : ""} have pending payments:`,
    "",
    ...pending.map(
      (m, i) =>
        `${i + 1}. ${m.name}${m.branch ? ` (${m.branch})` : ""} - Rs ${m.monthlyAmount}`
    ),
    "",
    "Please make your contribution at the earliest. Thank you!",
  ]
  return lines.join("\n")
}
