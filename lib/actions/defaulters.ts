"use server"

import { db } from "@/lib/db"
import { getCurrentMonthKey, getMonthsBetween } from "@/lib/format"
import { requireAuth } from "@/lib/auth-utils"

export type Defaulter = {
  id: string
  name: string
  branch: string
  consecutiveUnpaid: number
  severity: "yellow" | "orange" | "red"
  lastPaidMonth: string | null
}

export async function getDefaulters(): Promise<Defaulter[]> {
  await requireAuth()
  const now = new Date()
  const currentMonth = getCurrentMonthKey()

  const members = await db.member.findMany({
    where: { isActive: true },
    include: {
      receipts: {
        select: { forMonth: true },
        orderBy: { forMonth: "desc" },
      },
    },
  })

  return members
    .map((member) => {
      const paidMonths = new Set(member.receipts.map((r) => r.forMonth))
      let consecutive = 0
      const checkMonths = getMonthsBetween(member.joinDate, now).reverse()

      for (const month of checkMonths) {
        if (month > currentMonth) continue
        if (paidMonths.has(month)) break
        consecutive++
      }

      let severity: "yellow" | "orange" | "red" = "yellow"
      if (consecutive >= 6) severity = "red"
      else if (consecutive >= 3) severity = "orange"

      return {
        id: member.id,
        name: member.name,
        branch: member.branch,
        consecutiveUnpaid: consecutive,
        severity,
        lastPaidMonth: member.receipts[0]?.forMonth ?? null,
      }
    })
    .filter((m) => m.consecutiveUnpaid > 0)
    .sort((a, b) => b.consecutiveUnpaid - a.consecutiveUnpaid)
}

export async function getDefaulterStatus(memberId: string) {
  const now = new Date()
  const currentMonth = getCurrentMonthKey()

  const member = await db.member.findUnique({
    where: { id: memberId },
    include: {
      receipts: { select: { forMonth: true }, orderBy: { forMonth: "desc" } },
    },
  })

  if (!member) return null

  const paidMonths = new Set(member.receipts.map((r) => r.forMonth))
  let consecutive = 0
  const checkMonths = getMonthsBetween(member.joinDate, now).reverse()

  for (const month of checkMonths) {
    if (month > currentMonth) continue
    if (paidMonths.has(month)) break
    consecutive++
  }

  if (consecutive === 0) return null

  let severity: "yellow" | "orange" | "red" = "yellow"
  if (consecutive >= 6) severity = "red"
  else if (consecutive >= 3) severity = "orange"

  return { consecutiveUnpaid: consecutive, severity }
}
