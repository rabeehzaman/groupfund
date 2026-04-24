"use server"

import { auth } from "@/lib/auth"
import { supabase, generateId, now } from "@/lib/supabase"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { requireAdmin } from "@/lib/auth-utils"
import { messageSchema } from "@/lib/validations/message"

async function getMyMemberId() {
  const session = await auth()
  if (!session?.user?.memberId) redirect("/login")
  return session.user.memberId
}

export async function createMyMessage(_prevState: unknown, formData: FormData) {
  const memberId = await getMyMemberId()

  const parsed = messageSchema.safeParse({
    content: formData.get("content") ?? "",
  })

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const { error } = await supabase.from("MemberMessage").insert({
    id: generateId(),
    memberId,
    content: parsed.data.content,
    createdAt: now(),
  })

  if (error) throw error

  revalidatePath("/portal/messages")
  revalidatePath("/messages")
  return { success: true }
}

export async function getMyMessages() {
  const memberId = await getMyMemberId()

  const { data, error } = await supabase
    .from("MemberMessage")
    .select("*")
    .eq("memberId", memberId)
    .order("createdAt", { ascending: false })

  if (error) throw error
  return data ?? []
}

export async function getAllMessages() {
  await requireAdmin()

  const { data, error } = await supabase
    .from("MemberMessage")
    .select("*, Member(id, name, branch, photoUrl)")
    .order("createdAt", { ascending: false })

  if (error) throw error

  return (data ?? []).map((row: any) => {
    const { Member, ...rest } = row
    return { ...rest, member: Member }
  })
}
