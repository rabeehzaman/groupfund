import { z } from "zod"

export const memberSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  branch: z.string().max(100).default(""),
  monthlyAmount: z.coerce.number().min(0, "Amount must be positive").default(1000),
  isActive: z.coerce.boolean().default(true),
  mobileNumber: z.string().max(15).optional().or(z.literal("")),
  membershipNumber: z.string().max(50).optional().or(z.literal("")),
  dateOfBirth: z.coerce.date().optional(),
  dateOfAssociation: z.coerce.date().optional(),
  memberOfJAA: z.coerce.boolean().default(false),
  memberOfAKBJAF: z.coerce.boolean().default(false),
  presentDesignation: z.string().max(200).optional().or(z.literal("")),
  pmjjby: z.coerce.boolean().default(false),
  pmjjbyDetails: z.string().max(500).optional().or(z.literal("")),
  pmsby: z.coerce.boolean().default(false),
  pmsbyDetails: z.string().max(500).optional().or(z.literal("")),
  bloodGroup: z.string().max(10).optional().or(z.literal("")),
  branchAddress: z.string().max(500).optional().or(z.literal("")),
  homeAddress: z.string().max(500).optional().or(z.literal("")),
  photoUrl: z.string().optional().or(z.literal("")),
})

export type MemberFormValues = z.infer<typeof memberSchema>

// Profile schema for portal self-edit (excludes admin-only fields)
export const memberProfileSchema = z.object({
  mobileNumber: z.string().max(15).optional().or(z.literal("")),
  membershipNumber: z.string().max(50).optional().or(z.literal("")),
  dateOfBirth: z.coerce.date().optional(),
  dateOfAssociation: z.coerce.date().optional(),
  memberOfJAA: z.coerce.boolean().default(false),
  memberOfAKBJAF: z.coerce.boolean().default(false),
  presentDesignation: z.string().max(200).optional().or(z.literal("")),
  pmjjby: z.coerce.boolean().default(false),
  pmjjbyDetails: z.string().max(500).optional().or(z.literal("")),
  pmsby: z.coerce.boolean().default(false),
  pmsbyDetails: z.string().max(500).optional().or(z.literal("")),
  bloodGroup: z.string().max(10).optional().or(z.literal("")),
  branchAddress: z.string().max(500).optional().or(z.literal("")),
  homeAddress: z.string().max(500).optional().or(z.literal("")),
  photoUrl: z.string().optional().or(z.literal("")),
})

export type MemberProfileFormValues = z.infer<typeof memberProfileSchema>
