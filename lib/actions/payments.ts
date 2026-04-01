"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { supabase, generateId, now } from "@/lib/supabase"
import { paymentSchema } from "@/lib/validations/payment"
import { requireAdmin } from "@/lib/auth-utils"

export async function getPayments(from?: string, to?: string) {
  let query = supabase
    .from('Payment')
    .select('*')
    .order('date', { ascending: false })

  if (from) query = query.gte('date', new Date(from).toISOString())
  if (to) query = query.lte('date', new Date(to + "T23:59:59.999Z").toISOString())

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getPayment(id: string) {
  const { data, error } = await supabase
    .from('Payment')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function createPayment(_prevState: unknown, formData: FormData) {
  await requireAdmin()
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

  const { error } = await supabase
    .from('Payment')
    .insert({
      id: generateId(),
      ...parsed.data,
      createdAt: now(),
      updatedAt: now(),
    })

  if (error) throw error
  revalidatePath("/payments")
  revalidatePath("/dashboard")
  redirect("/payments")
}

export async function updatePayment(id: string, _prevState: unknown, formData: FormData) {
  await requireAdmin()
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

  const { error } = await supabase
    .from('Payment')
    .update({ ...parsed.data, updatedAt: now() })
    .eq('id', id)

  if (error) throw error
  revalidatePath("/payments")
  revalidatePath("/dashboard")
  redirect("/payments")
}

export async function deletePayment(id: string) {
  await requireAdmin()
  const { error } = await supabase
    .from('Payment')
    .delete()
    .eq('id', id)

  if (error) throw error
  revalidatePath("/payments")
  revalidatePath("/dashboard")
  return { success: true }
}
