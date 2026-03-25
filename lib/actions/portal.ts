"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
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

  const member = await db.member.findUnique({
    where: { id: memberId },
    include: {
      receipts: {
        orderBy: { forMonth: "desc" },
        include: {
          fund: { select: { id: true, name: true, type: true, amount: true } },
        },
      },
    },
  })

  if (!member) redirect("/login")

  const totalPaid = member.receipts.reduce((sum, r) => sum + r.amount, 0)
  const paymentsCount = member.receipts.length

  return { member, totalPaid, paymentsCount }
}

export async function getMyProfile() {
  const memberId = await getMyMemberId()

  const member = await db.member.findUnique({
    where: { id: memberId },
  })

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

  await db.member.update({
    where: { id: memberId },
    data: parsed.data,
  })

  revalidatePath("/portal")
  revalidatePath("/portal/profile")
  return { success: true }
}

export async function getMyPayments() {
  const memberId = await getMyMemberId()

  return db.receipt.findMany({
    where: { memberId },
    orderBy: { date: "desc" },
    include: {
      fund: { select: { name: true } },
    },
  })
}

export async function getMyReceiptsForUpload() {
  const memberId = await getMyMemberId()

  return db.receipt.findMany({
    where: { memberId },
    orderBy: { date: "desc" },
    include: {
      fund: { select: { name: true } },
    },
  })
}

export async function attachProofToReceipt(receiptId: string, proofUrl: string) {
  const memberId = await getMyMemberId()

  const receipt = await db.receipt.findUnique({ where: { id: receiptId } })
  if (!receipt || receipt.memberId !== memberId) {
    throw new Error("Receipt not found or not yours")
  }

  await db.receipt.update({
    where: { id: receiptId },
    data: { proofUrl, status: "PENDING" },
  })

  revalidatePath("/portal")
  return { success: true }
}
