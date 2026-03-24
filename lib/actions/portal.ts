"use server"

import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

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
  const monthsPaid = new Set(member.receipts.map((r) => r.forMonth)).size

  return { member, totalPaid, monthsPaid }
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
