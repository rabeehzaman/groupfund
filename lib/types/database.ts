export type Role = "ADMIN" | "MEMBER"
export type FundType = "FIXED" | "OPEN"
export type ReceiptStatus = "PENDING" | "VERIFIED" | "REJECTED"

export interface User {
  id: string
  email: string
  passwordHash: string
  name: string
  role: Role
  memberId: string | null
  createdAt: string
  updatedAt: string
}

export interface Fund {
  id: string
  name: string
  type: FundType
  amount: number | null
  yearlyAmount: number | null
  goalAmount: number | null
  description: string
  purpose: string
  isRecurring: boolean
  isActive: boolean
  isDefault: boolean
  startDate: string | null
  createdAt: string
  updatedAt: string
}

export interface Member {
  id: string
  name: string
  branch: string
  monthlyAmount: number
  joinDate: string
  isActive: boolean
  photoUrl: string | null
  mobileNumber: string | null
  membershipNumber: string | null
  dateOfBirth: string | null
  dateOfAssociation: string | null
  memberOfJAA: boolean
  memberOfAKBJAF: boolean
  presentDesignation: string | null
  pmjjby: boolean
  pmjjbyDetails: string | null
  pmsby: boolean
  pmsbyDetails: string | null
  bloodGroup: string | null
  branchAddress: string
  homeAddress: string
  createdAt: string
  updatedAt: string
}

export interface Receipt {
  id: string
  date: string
  amount: number
  forMonth: string | null
  narration: string
  status: ReceiptStatus
  proofUrl: string | null
  memberId: string
  fundId: string
  createdAt: string
  updatedAt: string
}

export interface Payment {
  id: string
  date: string
  amount: number
  purpose: string
  paidTo: string
  narration: string
  createdAt: string
  updatedAt: string
}

export interface Settings {
  id: string
  groupName: string
  defaultMonthlyAmount: number
  defaultYearlyAmount: number
  financialYearStart: number
  updatedAt: string
}
