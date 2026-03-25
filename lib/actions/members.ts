"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
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
  return db.member.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { receipts: true } },
    },
  })
}

export async function getMember(id: string) {
  return db.member.findUnique({ where: { id } })
}

export async function getMemberWithStats(id: string) {
  const member = await db.member.findUnique({
    where: { id },
    include: {
      receipts: {
        orderBy: { forMonth: "asc" },
        include: { fund: { select: { id: true, name: true, type: true, amount: true } } },
      },
    },
  })
  if (!member) return null

  const totalPaid = member.receipts.reduce((sum, r) => sum + r.amount, 0)

  return {
    ...member,
    totalPaid,
    paymentsCount: member.receipts.length,
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

  const member = await db.member.create({ data: parsed.data })

  // Auto-create login account for the new member
  const email = generateEmail(parsed.data.name, parsed.data.branch ?? "")
  const passwordHash = await bcrypt.hash("member123", 12)

  try {
    await db.user.create({
      data: {
        email,
        passwordHash,
        name: parsed.data.name,
        role: "MEMBER",
        memberId: member.id,
      },
    })
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

  await db.member.update({ where: { id }, data: parsed.data })
  revalidatePath("/members")
  revalidatePath(`/members/${id}`)
  redirect("/members")
}

export async function deleteMember(id: string) {
  await requireAdmin()
  const receipts = await db.receipt.count({ where: { memberId: id } })
  if (receipts > 0) {
    return {
      error:
        "Cannot delete member with existing receipts. Deactivate instead.",
    }
  }

  await db.member.delete({ where: { id } })
  revalidatePath("/members")
  return { success: true }
}
