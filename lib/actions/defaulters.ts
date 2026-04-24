"use server"

import { supabase } from "@/lib/supabase"
import { requireAuth } from "@/lib/auth-utils"
import { getMembersForFund } from "@/lib/actions/funds"

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
  let fund: any = null
  if (fundId) {
    const { data, error } = await supabase.from("Fund").select("*").eq("id", fundId).single()
    if (error) throw error
    fund = data
  } else {
    const { data } = await supabase.from("Fund").select("*").eq("isDefault", true).limit(1).single()
    fund = data
  }

  if (!fund) {
    const { data } = await supabase.from("Fund").select("*").eq("isActive", true).limit(1).single()
    fund = data
  }
  if (!fund || fund.type === "OPEN") return []

  const fundStartDate = new Date(fund.startDate ?? fund.createdAt)
  const yearlyAmount = fund.yearlyAmount ?? (fund.amount ? fund.amount * 12 : 0)
  if (yearlyAmount <= 0) return []

  // Fetch members subject to this fund + receipt totals
  const [members, receiptResult] = await Promise.all([
    getMembersForFund<{ id: string; name: string; branch: string; joinDate: string }>(
      fund,
      "id, name, branch, joinDate",
    ),
    supabase
      .from("Receipt")
      .select("memberId, amount")
      .eq("fundId", fund.id),
  ])

  if (receiptResult.error) throw receiptResult.error

  const receiptRows = receiptResult.data ?? []

  // Group receipts by memberId
  const paidMap = new Map<string, number>()
  for (const r of receiptRows) {
    paidMap.set(r.memberId, (paidMap.get(r.memberId) ?? 0) + r.amount)
  }

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
  // Get the target fund
  let fund: any = null
  if (fundId) {
    const { data, error } = await supabase.from("Fund").select("*").eq("id", fundId).single()
    if (error) throw error
    fund = data
  } else {
    const { data } = await supabase.from("Fund").select("*").eq("isDefault", true).limit(1).single()
    fund = data
  }

  if (!fund) {
    const { data } = await supabase.from("Fund").select("*").eq("isActive", true).limit(1).single()
    fund = data
  }
  if (!fund || fund.type === "OPEN") return null

  const yearlyAmount = fund.yearlyAmount ?? (fund.amount ? fund.amount * 12 : 0)
  if (yearlyAmount <= 0) return null

  // If fund only applies to select members, skip members not in the list
  if (fund.appliesToAllMembers === false) {
    const { count, error: mfError } = await supabase
      .from("MemberFund")
      .select("*", { count: "exact", head: true })
      .eq("fundId", fund.id)
      .eq("memberId", memberId)
    if (mfError) throw mfError
    if (!count) return null
  }

  // Fetch member
  const { data: member, error: memberError } = await supabase
    .from("Member")
    .select("*")
    .eq("id", memberId)
    .single()
  if (memberError) throw memberError
  if (!member) return null

  // Fetch receipts for this member and fund
  const { data: receiptRows, error: receiptError } = await supabase
    .from("Receipt")
    .select("amount")
    .eq("memberId", memberId)
    .eq("fundId", fund.id)
  if (receiptError) throw receiptError

  const totalPaid = (receiptRows ?? []).reduce((sum, r) => sum + r.amount, 0)
  const pendingAmount = yearlyAmount - totalPaid

  if (pendingAmount <= 0) return null

  return {
    pendingAmount,
    severity: getSeverity(totalPaid, yearlyAmount),
  }
}
