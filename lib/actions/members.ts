"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { supabase, generateId, now } from "@/lib/supabase"
import { memberSchema } from "@/lib/validations/member"
import { requireAuth, requireAdmin } from "@/lib/auth-utils"
import bcrypt from "bcryptjs"

function generateEmail(name: string, branch: string): string {
  const cleanName = name.toLowerCase().replace(/\s+/g, "")
  const cleanBranch = branch
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9]/g, "")
  return `${cleanName}.${cleanBranch}@groupfund.com`
}

export async function getMembers() {
  const { data, error } = await supabase
    .from('Member')
    .select('*, Receipt(count)')
    .order('name')

  if (error) throw error

  return (data ?? []).map((row: any) => {
    const _count = { receipts: row.Receipt?.[0]?.count ?? 0 }
    const { Receipt, ...rest } = row
    return { ...rest, _count }
  })
}

export async function getMember(id: string) {
  const { data, error } = await supabase
    .from('Member')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function getMemberWithStats(id: string) {
  const { data: member, error } = await supabase
    .from('Member')
    .select('*, Receipt(*, Fund(id, name, type, amount))')
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  if (!member) return null

  // Rename relations and sort receipts
  const receipts = (member.Receipt ?? [])
    .map((r: any) => {
      const { Fund, ...rest } = r
      return { ...rest, fund: Fund }
    })
    .sort((a: any, b: any) => {
      const aMonth = a.forMonth ?? ""
      const bMonth = b.forMonth ?? ""
      return aMonth < bMonth ? -1 : aMonth > bMonth ? 1 : 0
    })

  const { Receipt, ...memberRest } = member
  const totalPaid = receipts.reduce((sum: number, r: any) => sum + r.amount, 0)

  return {
    ...memberRest,
    receipts,
    totalPaid,
    paymentsCount: receipts.length,
  }
}

function extractProfileFields(formData: FormData) {
  const fields: Record<string, unknown> = {}

  const mobileNumber = formData.get("mobileNumber")
  if (mobileNumber !== null) fields.mobileNumber = mobileNumber

  const membershipNumber = formData.get("membershipNumber")
  if (membershipNumber !== null) fields.membershipNumber = membershipNumber

  const dateOfBirth = formData.get("dateOfBirth")
  if (dateOfBirth && String(dateOfBirth).trim() !== "") fields.dateOfBirth = dateOfBirth

  const dateOfAssociation = formData.get("dateOfAssociation")
  if (dateOfAssociation && String(dateOfAssociation).trim() !== "") fields.dateOfAssociation = dateOfAssociation

  fields.memberOfJAA = formData.get("memberOfJAA") === "true"
  fields.memberOfAKBJAF = formData.get("memberOfAKBJAF") === "true"

  const presentDesignation = formData.get("presentDesignation")
  if (presentDesignation !== null) fields.presentDesignation = presentDesignation

  fields.pmjjby = formData.get("pmjjby") === "true"
  const pmjjbyDetails = formData.get("pmjjbyDetails")
  if (pmjjbyDetails !== null) fields.pmjjbyDetails = pmjjbyDetails

  fields.pmsby = formData.get("pmsby") === "true"
  const pmsbyDetails = formData.get("pmsbyDetails")
  if (pmsbyDetails !== null) fields.pmsbyDetails = pmsbyDetails

  const bloodGroup = formData.get("bloodGroup")
  if (bloodGroup !== null) fields.bloodGroup = bloodGroup

  const branchAddress = formData.get("branchAddress")
  if (branchAddress !== null) fields.branchAddress = branchAddress

  const homeAddress = formData.get("homeAddress")
  if (homeAddress !== null) fields.homeAddress = homeAddress

  const photoUrl = formData.get("photoUrl")
  if (photoUrl !== null) fields.photoUrl = photoUrl

  return fields
}

export async function createMember(_prevState: unknown, formData: FormData) {
  await requireAdmin()
  const raw = {
    name: formData.get("name"),
    branch: formData.get("branch"),
    monthlyAmount: formData.get("monthlyAmount"),
    ...extractProfileFields(formData),
  }

  const parsed = memberSchema.safeParse(raw)

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const memberId = generateId()
  const { error: memberError } = await supabase
    .from('Member')
    .insert({ id: memberId, ...parsed.data, createdAt: now(), updatedAt: now() })

  if (memberError) throw memberError

  // Auto-create login account for the new member
  const email = generateEmail(parsed.data.name, parsed.data.branch ?? "")
  const passwordHash = await bcrypt.hash("member123", 12)

  try {
    const { error: userError } = await supabase
      .from('User')
      .insert({
        id: generateId(),
        email,
        passwordHash,
        name: parsed.data.name,
        role: "MEMBER",
        memberId,
        createdAt: now(),
        updatedAt: now(),
      })

    if (userError) throw userError
  } catch {
    // If email already exists (duplicate name+branch edge case), skip user creation
    console.warn(`Could not create user for ${email} — may already exist`)
  }

  revalidatePath("/members")
  redirect("/members")
}

export async function updateMember(id: string, _prevState: unknown, formData: FormData) {
  await requireAdmin()
  const raw = {
    name: formData.get("name"),
    branch: formData.get("branch"),
    monthlyAmount: formData.get("monthlyAmount"),
    isActive: formData.get("isActive") === "true",
    ...extractProfileFields(formData),
  }

  const parsed = memberSchema.safeParse(raw)

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const { error } = await supabase
    .from('Member')
    .update({ ...parsed.data, updatedAt: now() })
    .eq('id', id)

  if (error) throw error

  revalidatePath("/members")
  revalidatePath(`/members/${id}`)
  redirect("/members")
}

export async function deleteMember(id: string) {
  await requireAdmin()

  const { count, error: countError } = await supabase
    .from('Receipt')
    .select('*', { count: 'exact', head: true })
    .eq('memberId', id)

  if (countError) throw countError

  if ((count ?? 0) > 0) {
    return {
      error:
        "Cannot delete member with existing receipts. Deactivate instead.",
    }
  }

  // Delete associated user first
  const { error: userDeleteError } = await supabase
    .from('User')
    .delete()
    .eq('memberId', id)

  if (userDeleteError) throw userDeleteError

  const { error } = await supabase
    .from('Member')
    .delete()
    .eq('id', id)

  if (error) throw error

  revalidatePath("/members")
  return { success: true }
}
