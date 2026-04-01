"use server"

import { auth } from "@/lib/auth"
import { supabase, now } from "@/lib/supabase"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { memberProfileSchema } from "@/lib/validations/member"

async function getMyMemberId() {
  const session = await auth()
  if (!session?.user?.memberId) redirect("/login")
  return session.user.memberId
}

export async function getMyDashboard() {
  const memberId = await getMyMemberId()

  const { data: member, error } = await supabase
    .from('Member')
    .select('*, Receipt(*, Fund(id, name, type, amount))')
    .eq('id', memberId)
    .single()

  if (error) throw error
  if (!member) redirect("/login")

  // Rename relations and sort receipts desc by forMonth
  const receipts = (member.Receipt ?? [])
    .map((r: any) => {
      const { Fund, ...rest } = r
      return { ...rest, fund: Fund }
    })
    .sort((a: any, b: any) => {
      const aMonth = a.forMonth ?? ""
      const bMonth = b.forMonth ?? ""
      return aMonth > bMonth ? -1 : aMonth < bMonth ? 1 : 0
    })

  const { Receipt, ...memberRest } = member
  const memberWithReceipts = { ...memberRest, receipts }

  const totalPaid = receipts.reduce((sum: number, r: any) => sum + r.amount, 0)
  const paymentsCount = receipts.length

  return { member: memberWithReceipts, totalPaid, paymentsCount }
}

export async function getMyProfile() {
  const memberId = await getMyMemberId()

  const { data: member, error } = await supabase
    .from('Member')
    .select('*')
    .eq('id', memberId)
    .maybeSingle()

  if (error) throw error
  if (!member) redirect("/login")
  return member
}

export async function updateMyProfile(_prevState: unknown, formData: FormData) {
  const memberId = await getMyMemberId()

  const raw: Record<string, unknown> = {
    mobileNumber: formData.get("mobileNumber") ?? "",
    membershipNumber: formData.get("membershipNumber") ?? "",
    presentDesignation: formData.get("presentDesignation") ?? "",
    memberOfJAA: formData.get("memberOfJAA") === "true",
    memberOfAKBJAF: formData.get("memberOfAKBJAF") === "true",
    pmjjby: formData.get("pmjjby") === "true",
    pmjjbyDetails: formData.get("pmjjbyDetails") ?? "",
    pmsby: formData.get("pmsby") === "true",
    pmsbyDetails: formData.get("pmsbyDetails") ?? "",
    bloodGroup: formData.get("bloodGroup") ?? "",
    branchAddress: formData.get("branchAddress") ?? "",
    homeAddress: formData.get("homeAddress") ?? "",
    photoUrl: formData.get("photoUrl") ?? "",
  }

  const dateOfBirth = formData.get("dateOfBirth")
  if (dateOfBirth && String(dateOfBirth).trim() !== "") raw.dateOfBirth = dateOfBirth

  const dateOfAssociation = formData.get("dateOfAssociation")
  if (dateOfAssociation && String(dateOfAssociation).trim() !== "") raw.dateOfAssociation = dateOfAssociation

  const parsed = memberProfileSchema.safeParse(raw)

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const { error } = await supabase
    .from('Member')
    .update({ ...parsed.data, updatedAt: now() })
    .eq('id', memberId)

  if (error) throw error

  revalidatePath("/portal")
  revalidatePath("/portal/profile")
  return { success: true }
}

export async function getMyPayments() {
  const memberId = await getMyMemberId()

  const { data, error } = await supabase
    .from('Receipt')
    .select('*, Fund(name)')
    .eq('memberId', memberId)
    .order('date', { ascending: false })

  if (error) throw error

  return (data ?? []).map((row: any) => {
    const { Fund, ...rest } = row
    return { ...rest, fund: Fund }
  })
}

export async function getMyReceiptsForUpload() {
  const memberId = await getMyMemberId()

  const { data, error } = await supabase
    .from('Receipt')
    .select('*, Fund(name)')
    .eq('memberId', memberId)
    .order('date', { ascending: false })

  if (error) throw error

  return (data ?? []).map((row: any) => {
    const { Fund, ...rest } = row
    return { ...rest, fund: Fund }
  })
}

export async function attachProofToReceipt(receiptId: string, proofUrl: string) {
  const memberId = await getMyMemberId()

  const { data: receipt, error: fetchError } = await supabase
    .from('Receipt')
    .select('*')
    .eq('id', receiptId)
    .maybeSingle()

  if (fetchError) throw fetchError
  if (!receipt || receipt.memberId !== memberId) {
    throw new Error("Receipt not found or not yours")
  }

  const { error } = await supabase
    .from('Receipt')
    .update({ proofUrl, status: "PENDING", updatedAt: now() })
    .eq('id', receiptId)

  if (error) throw error

  revalidatePath("/portal")
  return { success: true }
}
