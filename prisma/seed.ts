import { config } from "dotenv"
config()

import { createClient } from "@supabase/supabase-js"
import bcrypt from "bcryptjs"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const MONTHLY_AMOUNT = 1000
const YEARS = [2020, 2021, 2022, 2023, 2024, 2025, 2026]

type PaymentStatus = "full" | number | null

const members: {
  name: string
  branch: string
  payments: PaymentStatus[]
}[] = [
  { name: "Manikandan", branch: "Edappal", payments: ["full", "full", "full", "full", "full", null, null] },
  { name: "Baiju", branch: "Edakkara", payments: ["full", "full", "full", "full", 2300, null, null] },
  { name: "Ramachandran", branch: "Thiruvegapura", payments: ["full", "full", "full", "full", "full", "full", null] },
  { name: "Roshan", branch: "Kulathur", payments: ["full", "full", "full", "full", 1000, null, null] },
  { name: "Prasanth", branch: "Manjeri Main", payments: ["full", "full", "full", "full", "full", 1000, null] },
  { name: "Arjun", branch: "Edavanna", payments: ["full", "full", "full", "full", 500, null, null] },
  { name: "Shinoop", branch: "Re-App", payments: ["full", "full", "full", "full", 1000, null, null] },
  { name: "Asainar", branch: "Kalikav", payments: ["full", "full", "full", null, null, null, null] },
  { name: "Sujeesh", branch: "Nannabra", payments: ["full", "full", "full", "full", "full", "full", null] },
  { name: "Krishnadas", branch: "Edappatta", payments: ["full", "full", "full", "full", "full", "full", null] },
  { name: "Aneesh", branch: "Karigallathani", payments: ["full", "full", "full", "full", "full", "full", null] },
  { name: "Binoj", branch: "Malappuram Main", payments: [null, "full", "full", "full", "full", null, null] },
  { name: "Sreenivasan", branch: "Trikkalangode", payments: [null, "full", "full", null, null, null, null] },
  { name: "Promis King", branch: "Changaramkulam", payments: [null, null, null, null, 500, null, null] },
  { name: "Rajan", branch: "Perumbadappu", payments: ["full", "full", null, null, null, null, null] },
  { name: "Bijeesh", branch: "Valluvambram", payments: ["full", "full", "full", 2500, null, null, null] },
  { name: "Joshy", branch: "Thirurangadi", payments: ["full", "full", "full", "full", "full", null, null] },
  { name: "Lijeesh", branch: "Vailathur", payments: ["full", "full", 2500, null, null, null, null] },
  { name: "Sundaran", branch: "Kondotty", payments: [2000, null, null, null, null, null, null] },
  { name: "Surendran", branch: "Kunnumpuram", payments: ["full", "full", "full", "full", "full", "full", null] },
  { name: "Babu Raj", branch: "Kuttippuram", payments: ["full", "full", "full", null, null, null, null] },
  { name: "Ramesh", branch: "Puthanathani", payments: ["full", "full", "full", "full", 1000, null, null] },
  { name: "Bhaskaran", branch: "Vengara", payments: ["full", "full", "full", "full", "full", "full", 500] },
  { name: "Afsal", branch: "Thanur", payments: ["full", "full", "full", "full", "full", null, null] },
  { name: "Baiju", branch: "Parambilpedika", payments: ["full", "full", "full", null, null, null, null] },
  { name: "Thulasidas", branch: "Valanjeri", payments: ["full", "full", "full", "full", null, null, null] },
  { name: "Rajeev", branch: "Wandoor", payments: ["full", "full", "full", "full", 2500, null, null] },
  { name: "Prabeesh", branch: "Aanagadi", payments: ["full", "full", "full", 2500, null, null, null] },
  { name: "Subeesh", branch: "Kurukathani", payments: ["full", "full", 1000, null, null, null, null] },
  { name: "Manoj Kumar", branch: "Kadampuzha", payments: ["full", "full", "full", "full", 900, null, null] },
  { name: "Ranjith", branch: "Angadippuram", payments: ["full", "full", "full", "full", null, null, null] },
  { name: "Nithin", branch: "Nilambur", payments: ["full", "full", "full", "full", "full", null, null] },
  { name: "Suresh Babu", branch: "Melattur", payments: ["full", "full", "full", "full", 500, null, null] },
  { name: "Omanakuttan", branch: "Vettilappara", payments: ["full", "full", "full", 1000, null, null, null] },
  { name: "Abhilash", branch: "Arekode", payments: ["full", "full", "full", null, null, null, null] },
  { name: "Joy", branch: "Parappanagadi", payments: ["full", "full", "full", 2000, null, null, null] },
  { name: "Prakash", branch: "BP Anagadi", payments: ["full", "full", "full", "full", "full", "full", null] },
  { name: "Subhash", branch: "Alshifa PMNA", payments: ["full", "full", "full", 2000, null, null, null] },
  { name: "Anil Kumar", branch: "Ponnani", payments: [null, null, 1000, null, null, null, null] },
  { name: "Unnikrishnan", branch: "Thirur", payments: [null, 1500, null, null, null, null, null] },
  { name: "Manoj Kumar", branch: "Kalpakanjeri", payments: [null, 2000, null, null, null, null, null] },
  { name: "Akhil", branch: "Parappur", payments: [null, null, null, null, null, 500, null] },
  { name: "Suresh Babu", branch: "Ponmala", payments: [null, null, null, null, null, null, null] },
  { name: "Pramod", branch: "Ramapuram", payments: [null, null, "full", "full", 500, null, null] },
  { name: "Pradeep Kumar", branch: "Thirur-Pookkayil", payments: [null, null, 600, null, null, null, null] },
]

function generateEmail(name: string, branch: string): string {
  const cleanName = name.toLowerCase().replace(/\s+/g, "")
  const cleanBranch = branch.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "")
  return `${cleanName}.${cleanBranch}@groupfund.com`
}

function spreadAmount(total: number, monthlyAmount: number): number[] {
  const result: number[] = []
  let remaining = total
  while (remaining > 0) {
    result.push(Math.min(remaining, monthlyAmount))
    remaining -= monthlyAmount
  }
  return result
}

async function main() {
  console.log("Seeding database...")
  const ts = new Date().toISOString()

  // Clear existing data (order matters for foreign keys)
  await supabase.from("Receipt").delete().neq("id", "")
  await supabase.from("Payment").delete().neq("id", "")
  await supabase.from("User").delete().neq("id", "")
  await supabase.from("Member").delete().neq("id", "")
  await supabase.from("Fund").delete().neq("id", "")
  await supabase.from("Settings").delete().neq("id", "")
  console.log("Cleared existing data.")

  // Create admin user
  const adminHash = await bcrypt.hash("admin123", 12)
  const { error: adminErr } = await supabase.from("User").insert({
    id: crypto.randomUUID(),
    email: "admin@groupfund.com",
    passwordHash: adminHash,
    name: "Admin",
    role: "ADMIN",
    createdAt: ts,
    updatedAt: ts,
  })
  if (adminErr) throw adminErr
  console.log("Admin user created (admin@groupfund.com / admin123)")

  // Create settings
  const { error: settingsErr } = await supabase.from("Settings").insert({
    id: "default",
    groupName: "Group Fund",
    defaultMonthlyAmount: MONTHLY_AMOUNT,
    defaultYearlyAmount: 3000,
    financialYearStart: 1,
    updatedAt: ts,
  })
  if (settingsErr) throw settingsErr
  console.log("Settings created.")

  // Create default fund
  const fundId = crypto.randomUUID()
  const { error: fundErr } = await supabase.from("Fund").insert({
    id: fundId,
    name: "Monthly Contribution",
    type: "FIXED",
    amount: MONTHLY_AMOUNT,
    description: "",
    purpose: "",
    isRecurring: true,
    isDefault: true,
    isActive: true,
    createdAt: ts,
    updatedAt: ts,
  })
  if (fundErr) throw fundErr
  console.log("Default fund created: Monthly Contribution")

  // Create all members
  const memberPassword = await bcrypt.hash("member123", 12)

  for (let i = 0; i < members.length; i++) {
    const memberData = members[i]

    let joinYear = 2020
    for (let y = 0; y < YEARS.length; y++) {
      if (memberData.payments[y] !== null) {
        joinYear = YEARS[y]
        break
      }
    }

    const email = generateEmail(memberData.name, memberData.branch)
    const memberId = crypto.randomUUID()

    const { error: memberErr } = await supabase.from("Member").insert({
      id: memberId,
      name: memberData.name,
      branch: memberData.branch,
      monthlyAmount: MONTHLY_AMOUNT,
      joinDate: new Date(`${joinYear}-01-01`).toISOString(),
      isActive: true,
      memberOfJAA: false,
      memberOfAKBJAF: false,
      pmjjby: false,
      pmsby: false,
      branchAddress: "",
      homeAddress: "",
      createdAt: ts,
      updatedAt: ts,
    })
    if (memberErr) throw memberErr

    const { error: userErr } = await supabase.from("User").insert({
      id: crypto.randomUUID(),
      email,
      passwordHash: memberPassword,
      name: memberData.name,
      role: "MEMBER",
      memberId,
      createdAt: ts,
      updatedAt: ts,
    })
    if (userErr) throw userErr

    // Build receipts
    const receipts: Record<string, unknown>[] = []

    for (let y = 0; y < YEARS.length; y++) {
      const payment = memberData.payments[y]
      if (payment === null) continue

      const year = YEARS[y]
      const totalAmount = payment === "full" ? 12 * MONTHLY_AMOUNT : payment
      const monthlyAmounts = spreadAmount(totalAmount, MONTHLY_AMOUNT)

      for (let m = 0; m < monthlyAmounts.length; m++) {
        const month = m + 1
        receipts.push({
          id: crypto.randomUUID(),
          date: new Date(year, month - 1, 15).toISOString(),
          amount: monthlyAmounts[m],
          forMonth: `${year}-${String(month).padStart(2, "0")}`,
          narration: monthlyAmounts[m] === MONTHLY_AMOUNT ? "Monthly contribution" : "Partial payment",
          status: "VERIFIED",
          memberId,
          fundId,
          createdAt: ts,
          updatedAt: ts,
        })
      }
    }

    if (receipts.length > 0) {
      const { error: receiptErr } = await supabase.from("Receipt").insert(receipts)
      if (receiptErr) throw receiptErr
    }

    console.log(
      `  Member ${i + 1}/${members.length}: ${memberData.name} - ${memberData.branch} | ${email} (${receipts.length} receipts)`
    )
  }

  console.log(`\nSeeded ${members.length} members with receipts.`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
