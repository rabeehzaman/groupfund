"use server"

import { supabase } from "@/lib/supabase"
import { requireAuth } from "@/lib/auth-utils"

export async function getFundDashboard(fundId: string) {
  await requireAuth()

  // Fetch the fund
  const { data: fund, error: fundError } = await supabase
    .from("Fund")
    .select("*")
    .eq("id", fundId)
    .single()
  if (fundError) throw fundError
  if (!fund) return null

  // Fetch receipt stats and recent receipts in parallel
  const [receiptAmountResult, receiptMemberResult, recentReceiptResult] = await Promise.all([
    supabase.from("Receipt").select("amount").eq("fundId", fundId),
    supabase.from("Receipt").select("memberId").eq("fundId", fundId),
    supabase
      .from("Receipt")
      .select("*, member:Member(name, branch)")
      .eq("fundId", fundId)
      .order("date", { ascending: false })
      .limit(10),
  ])

  if (receiptAmountResult.error) throw receiptAmountResult.error
  if (receiptMemberResult.error) throw receiptMemberResult.error
  if (recentReceiptResult.error) throw recentReceiptResult.error

  const receiptAmountRows = receiptAmountResult.data ?? []
  const receiptMemberRows = receiptMemberResult.data ?? []
  const recentReceipts = recentReceiptResult.data ?? []

  const collected = receiptAmountRows.reduce((sum, r) => sum + r.amount, 0)
  const receiptCount = receiptAmountRows.length

  // Count unique contributors
  const uniqueMemberIds = new Set(receiptMemberRows.map((r) => r.memberId))
  const uniqueContributors = uniqueMemberIds.size

  if (fund.type === "FIXED") {
    let activeMembers = 0
    if (fund.appliesToAllMembers === false) {
      const { data: mfRows, error: mfError } = await supabase
        .from("MemberFund")
        .select("memberId, Member!inner(isActive)")
        .eq("fundId", fundId)
      if (mfError) throw mfError
      activeMembers = (mfRows ?? []).filter(
        (r: any) => r.Member?.isActive,
      ).length
    } else {
      const { count, error: memberError } = await supabase
        .from("Member")
        .select("*", { count: "exact", head: true })
        .eq("isActive", true)
      if (memberError) throw memberError
      activeMembers = count ?? 0
    }

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
      receiptCount,
      uniqueContributors,
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
      receiptCount,
      uniqueContributors,
      recentReceipts,
    }
  }
}
