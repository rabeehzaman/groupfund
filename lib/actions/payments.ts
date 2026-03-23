"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { paymentSchema } from "@/lib/validations/payment"

export async function getPayments(from?: string, to?: string) {
  const where: { date?: { gte?: Date; lte?: Date } } = {}
  if (from || to) {
    where.date = {}
    if (from) where.date.gte = new Date(from)
    if (to) where.date.lte = new Date(to + "T23:59:59.999Z")
  }
  return db.payment.findMany({ where, orderBy: { date: "desc" } })
}

export async function getPayment(id: string) {
  return db.payment.findUnique({ where: { id } })
}

export async function createPayment(_prevState: unknown, formData: FormData) {
  const parsed = paymentSchema.safeParse({
    date: formData.get("date"),
    amount: formData.get("amount"),
    purpose: formData.get("purpose"),
    paidTo: formData.get("paidTo"),
    narration: formData.get("narration"),
  })

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  await db.payment.create({ data: parsed.data })
  revalidatePath("/payments")
  revalidatePath("/dashboard")
  redirect("/payments")
}

export async function updatePayment(id: string, _prevState: unknown, formData: FormData) {
  const parsed = paymentSchema.safeParse({
    date: formData.get("date"),
    amount: formData.get("amount"),
    purpose: formData.get("purpose"),
    paidTo: formData.get("paidTo"),
    narration: formData.get("narration"),
  })

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  await db.payment.update({ where: { id }, data: parsed.data })
  revalidatePath("/payments")
  revalidatePath("/dashboard")
  redirect("/payments")
}

export async function deletePayment(id: string) {
  await db.payment.delete({ where: { id } })
  revalidatePath("/payments")
  revalidatePath("/dashboard")
  return { success: true }
}
