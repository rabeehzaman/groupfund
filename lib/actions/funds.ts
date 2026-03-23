"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { fundSchema } from "@/lib/validations/fund"

export async function getFunds() {
  return db.fund.findMany({
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    include: { _count: { select: { receipts: true } } },
  })
}

export async function getActiveFunds() {
  return db.fund.findMany({
    where: { isActive: true },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  })
}

export async function getFund(id: string) {
  return db.fund.findUnique({
    where: { id },
    include: { _count: { select: { receipts: true } } },
  })
}

export async function getDefaultFund() {
  return db.fund.findFirst({ where: { isDefault: true } })
}

export async function createFund(
  _prevState: unknown,
  formData: FormData
) {
  const raw: Record<string, unknown> = {
    name: formData.get("name"),
    type: formData.get("type"),
    description: formData.get("description"),
    purpose: formData.get("purpose"),
    isRecurring: formData.get("isRecurring") === "true",
  }

  const amount = formData.get("amount")
  if (amount && String(amount).trim() !== "") raw.amount = amount

  const goalAmount = formData.get("goalAmount")
  if (goalAmount && String(goalAmount).trim() !== "")
    raw.goalAmount = goalAmount

  const parsed = fundSchema.safeParse(raw)

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const data: {
    name: string
    type: "FIXED" | "OPEN"
    amount: number | null
    goalAmount: number | null
    description: string
    purpose: string
    isRecurring: boolean
  } = {
    name: parsed.data.name,
    type: parsed.data.type,
    amount: parsed.data.type === "FIXED" ? (parsed.data.amount ?? null) : null,
    goalAmount:
      parsed.data.type === "OPEN" ? (parsed.data.goalAmount ?? null) : null,
    description: parsed.data.description ?? "",
    purpose: parsed.data.purpose ?? "",
    isRecurring: parsed.data.isRecurring ?? true,
  }

  await db.fund.create({ data })
  revalidatePath("/funds")
  redirect("/funds")
}

export async function updateFund(
  id: string,
  _prevState: unknown,
  formData: FormData
) {
  const existing = await db.fund.findUnique({ where: { id } })
  if (!existing) return { error: { name: ["Fund not found"] } }

  const raw: Record<string, unknown> = {
    name: formData.get("name"),
    type: existing.isDefault ? existing.type : formData.get("type"),
    description: formData.get("description"),
    purpose: formData.get("purpose"),
    isRecurring: formData.get("isRecurring") === "true",
  }

  const amount = formData.get("amount")
  if (amount && String(amount).trim() !== "") raw.amount = amount

  const goalAmount = formData.get("goalAmount")
  if (goalAmount && String(goalAmount).trim() !== "")
    raw.goalAmount = goalAmount

  const parsed = fundSchema.safeParse(raw)

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const data: {
    name: string
    type: "FIXED" | "OPEN"
    amount: number | null
    goalAmount: number | null
    description: string
    purpose: string
    isRecurring: boolean
  } = {
    name: parsed.data.name,
    type: parsed.data.type,
    amount: parsed.data.type === "FIXED" ? (parsed.data.amount ?? null) : null,
    goalAmount:
      parsed.data.type === "OPEN" ? (parsed.data.goalAmount ?? null) : null,
    description: parsed.data.description ?? "",
    purpose: parsed.data.purpose ?? "",
    isRecurring: parsed.data.isRecurring ?? true,
  }

  await db.fund.update({ where: { id }, data })
  revalidatePath("/funds")
  redirect("/funds")
}

export async function deleteFund(id: string) {
  const fund = await db.fund.findUnique({
    where: { id },
    include: { _count: { select: { receipts: true } } },
  })

  if (!fund) return { error: "Fund not found" }
  if (fund.isDefault) return { error: "Cannot delete the default fund" }
  if (fund._count.receipts > 0)
    return { error: "Cannot delete a fund that has receipts" }

  await db.fund.delete({ where: { id } })
  revalidatePath("/funds")
  return { success: true }
}
