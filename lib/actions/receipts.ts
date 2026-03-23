"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { receiptSchema } from "@/lib/validations/receipt"

export async function getReceipts(from?: string, to?: string, fundId?: string) {
  const where: { date?: { gte?: Date; lte?: Date }; fundId?: string } = {}
  if (from || to) {
    where.date = {}
    if (from) where.date.gte = new Date(from)
    if (to) where.date.lte = new Date(to + "T23:59:59.999Z")
  }
  if (fundId) where.fundId = fundId
  return db.receipt.findMany({
    where,
    orderBy: { date: "desc" },
    include: {
      member: { select: { name: true, branch: true } },
      fund: { select: { name: true } },
    },
  })
}

export async function getReceipt(id: string) {
  return db.receipt.findUnique({
    where: { id },
    include: {
      member: { select: { name: true } },
      fund: { select: { name: true } },
    },
  })
}

export async function createReceipt(_prevState: unknown, formData: FormData) {
  let fundId = formData.get("fundId") as string | null
  if (!fundId) {
    const defaultFund = await db.fund.findFirst({ where: { isDefault: true } })
    if (!defaultFund) return { error: { fundId: ["No default fund found. Please create a fund first."] } }
    fundId = defaultFund.id
  }

  const parsed = receiptSchema.safeParse({
    date: formData.get("date"),
    amount: formData.get("amount"),
    forMonth: formData.get("forMonth"),
    narration: formData.get("narration"),
    memberId: formData.get("memberId"),
    fundId,
  })

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  await db.receipt.create({ data: parsed.data })
  revalidatePath("/receipts")
  revalidatePath("/dashboard")
  revalidatePath(`/members/${parsed.data.memberId}`)
  redirect("/receipts")
}

export async function updateReceipt(id: string, _prevState: unknown, formData: FormData) {
  let fundId = formData.get("fundId") as string | null
  if (!fundId) {
    const existing = await db.receipt.findUnique({ where: { id }, select: { fundId: true } })
    fundId = existing?.fundId ?? null
    if (!fundId) {
      const defaultFund = await db.fund.findFirst({ where: { isDefault: true } })
      if (!defaultFund) return { error: { fundId: ["No default fund found."] } }
      fundId = defaultFund.id
    }
  }

  const parsed = receiptSchema.safeParse({
    date: formData.get("date"),
    amount: formData.get("amount"),
    forMonth: formData.get("forMonth"),
    narration: formData.get("narration"),
    memberId: formData.get("memberId"),
    fundId,
  })

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  await db.receipt.update({ where: { id }, data: parsed.data })
  revalidatePath("/receipts")
  revalidatePath("/dashboard")
  redirect("/receipts")
}

export async function deleteReceipt(id: string) {
  await db.receipt.delete({ where: { id } })
  revalidatePath("/receipts")
  revalidatePath("/dashboard")
  return { success: true }
}

export async function createBatchReceipts(data: {
  date: string
  forMonth: string
  fundId?: string
  entries: { memberId: string; amount: number; narration: string }[]
}) {
  let fundId = data.fundId
  if (!fundId) {
    const defaultFund = await db.fund.findFirst({ where: { isDefault: true } })
    if (!defaultFund) throw new Error("No default fund found. Please create a fund first.")
    fundId = defaultFund.id
  }

  const receipts = data.entries.map((entry) => ({
    date: new Date(data.date),
    forMonth: data.forMonth,
    fundId,
    amount: entry.amount,
    narration: entry.narration,
    memberId: entry.memberId,
  }))

  const result = await Promise.all(
    receipts.map((r) => db.receipt.create({ data: r }))
  )

  revalidatePath("/receipts")
  revalidatePath("/dashboard")
  revalidatePath("/members")
  return { success: true, count: result.length }
}
