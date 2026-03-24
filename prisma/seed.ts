import { config } from "dotenv"
config()

import { neonConfig } from "@neondatabase/serverless"
import { PrismaNeon } from "@prisma/adapter-neon"
import { PrismaClient } from "@prisma/client"
import ws from "ws"
import bcrypt from "bcryptjs"

neonConfig.webSocketConstructor = ws as unknown as typeof WebSocket

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error("DATABASE_URL is not set")
}

const adapter = new PrismaNeon({ connectionString })
const prisma = new PrismaClient({ adapter })

// Members from the group spreadsheet (updated 30.12.2025)
// Payment columns: 2020, 2021, 2022, 2023, 2024, 2025, 2026
// "full" = all 12 months paid at 1000/month, number = partial amount, null = no payment

const MONTHLY_AMOUNT = 1000
const YEARS = [2020, 2021, 2022, 2023, 2024, 2025, 2026]

type PaymentStatus = "full" | number | null

const members: {
  name: string
  branch: string
  payments: PaymentStatus[]
}[] = [
  // 1
  { name: "Manikandan", branch: "Edappal", payments: ["full", "full", "full", "full", "full", null, null] },
  // 2
  { name: "Baiju", branch: "Edakkara", payments: ["full", "full", "full", "full", 2300, null, null] },
  // 3
  { name: "Ramachandran", branch: "Thiruvegapura", payments: ["full", "full", "full", "full", "full", "full", null] },
  // 4
  { name: "Roshan", branch: "Kulathur", payments: ["full", "full", "full", "full", 1000, null, null] },
  // 5
  { name: "Prasanth", branch: "Manjeri Main", payments: ["full", "full", "full", "full", "full", 1000, null] },
  // 6
  { name: "Arjun", branch: "Edavanna", payments: ["full", "full", "full", "full", 500, null, null] },
  // 7
  { name: "Shinoop", branch: "Re-App", payments: ["full", "full", "full", "full", 1000, null, null] },
  // 8
  { name: "Asainar", branch: "Kalikav", payments: ["full", "full", "full", null, null, null, null] },
  // 9
  { name: "Sujeesh", branch: "Nannabra", payments: ["full", "full", "full", "full", "full", "full", null] },
  // 10
  { name: "Krishnadas", branch: "Edappatta", payments: ["full", "full", "full", "full", "full", "full", null] },
  // 11
  { name: "Aneesh", branch: "Karigallathani", payments: ["full", "full", "full", "full", "full", "full", null] },
  // 12
  { name: "Binoj", branch: "Malappuram Main", payments: [null, "full", "full", "full", "full", null, null] },
  // 13
  { name: "Sreenivasan", branch: "Trikkalangode", payments: [null, "full", "full", null, null, null, null] },
  // 14
  { name: "Promis King", branch: "Changaramkulam", payments: [null, null, null, null, 500, null, null] },
  // 15
  { name: "Rajan", branch: "Perumbadappu", payments: ["full", "full", null, null, null, null, null] },
  // 16
  { name: "Bijeesh", branch: "Valluvambram", payments: ["full", "full", "full", 2500, null, null, null] },
  // 17
  { name: "Joshy", branch: "Thirurangadi", payments: ["full", "full", "full", "full", "full", null, null] },
  // 18
  { name: "Lijeesh", branch: "Vailathur", payments: ["full", "full", 2500, null, null, null, null] },
  // 19
  { name: "Sundaran", branch: "Kondotty", payments: [2000, null, null, null, null, null, null] },
  // 20
  { name: "Surendran", branch: "Kunnumpuram", payments: ["full", "full", "full", "full", "full", "full", null] },
  // 21
  { name: "Babu Raj", branch: "Kuttippuram", payments: ["full", "full", "full", null, null, null, null] },
  // 22
  { name: "Ramesh", branch: "Puthanathani", payments: ["full", "full", "full", "full", 1000, null, null] },
  // 23
  { name: "Bhaskaran", branch: "Vengara", payments: ["full", "full", "full", "full", "full", "full", 500] },
  // 24
  { name: "Afsal", branch: "Thanur", payments: ["full", "full", "full", "full", "full", null, null] },
  // 25
  { name: "Baiju", branch: "Parambilpedika", payments: ["full", "full", "full", null, null, null, null] },
  // 26
  { name: "Thulasidas", branch: "Valanjeri", payments: ["full", "full", "full", "full", null, null, null] },
  // 27
  { name: "Rajeev", branch: "Wandoor", payments: ["full", "full", "full", "full", 2500, null, null] },
  // 28
  { name: "Prabeesh", branch: "Aanagadi", payments: ["full", "full", "full", 2500, null, null, null] },
  // 29
  { name: "Subeesh", branch: "Kurukathani", payments: ["full", "full", 1000, null, null, null, null] },
  // 30
  { name: "Manoj Kumar", branch: "Kadampuzha", payments: ["full", "full", "full", "full", 900, null, null] },
  // 31
  { name: "Ranjith", branch: "Angadippuram", payments: ["full", "full", "full", "full", null, null, null] },
  // 32
  { name: "Nithin", branch: "Nilambur", payments: ["full", "full", "full", "full", "full", null, null] },
  // 33
  { name: "Suresh Babu", branch: "Melattur", payments: ["full", "full", "full", "full", 500, null, null] },
  // 34
  { name: "Omanakuttan", branch: "Vettilappara", payments: ["full", "full", "full", 1000, null, null, null] },
  // 35
  { name: "Abhilash", branch: "Arekode", payments: ["full", "full", "full", null, null, null, null] },
  // 36
  { name: "Joy", branch: "Parappanagadi", payments: ["full", "full", "full", 2000, null, null, null] },
  // 37
  { name: "Prakash", branch: "BP Anagadi", payments: ["full", "full", "full", "full", "full", "full", null] },
  // 38
  { name: "Subhash", branch: "Alshifa PMNA", payments: ["full", "full", "full", 2000, null, null, null] },
  // 39
  { name: "Anil Kumar", branch: "Ponnani", payments: [null, null, 1000, null, null, null, null] },
  // 40
  { name: "Unnikrishnan", branch: "Thirur", payments: [null, 1500, null, null, null, null, null] },
  // 41
  { name: "Manoj Kumar", branch: "Kalpakanjeri", payments: [null, 2000, null, null, null, null, null] },
  // 42
  { name: "Akhil", branch: "Parappur", payments: [null, null, null, null, null, 500, null] },
  // 43
  { name: "Suresh Babu", branch: "Ponmala", payments: [null, null, null, null, null, null, null] },
  // 44
  { name: "Pramod", branch: "Ramapuram", payments: [null, null, "full", "full", 500, null, null] },
  // 45
  { name: "Pradeep Kumar", branch: "Thirur-Pookkayil", payments: [null, null, 600, null, null, null, null] },
]

// Generate email from name + branch
function generateEmail(name: string, branch: string): string {
  const cleanName = name.toLowerCase().replace(/\s+/g, "")
  const cleanBranch = branch.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9]/g, "")
  return `${cleanName}.${cleanBranch}@groupfund.com`
}

// Spread a total amount into monthly receipts
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

  // Clear existing data
  await prisma.receipt.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.user.deleteMany()
  await prisma.member.deleteMany()
  await prisma.fund.deleteMany()
  console.log("Cleared existing data.")

  // Create admin user
  const adminHash = await bcrypt.hash("admin123", 12)
  await prisma.user.create({
    data: {
      email: "admin@groupfund.com",
      passwordHash: adminHash,
      name: "Admin",
      role: "ADMIN",
    },
  })
  console.log("Admin user created (admin@groupfund.com / admin123)")

  // Upsert settings
  await prisma.settings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      groupName: "Group Fund",
      defaultMonthlyAmount: MONTHLY_AMOUNT,
      financialYearStart: 1, // January
    },
  })
  console.log("Settings created.")

  // Create default fund
  const defaultFund = await prisma.fund.create({
    data: {
      name: "Monthly Contribution",
      type: "FIXED",
      amount: MONTHLY_AMOUNT,
      isRecurring: true,
      isDefault: true,
      isActive: true,
    },
  })
  console.log("Default fund created:", defaultFund.name)

  // Create all members with login accounts
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

    const member = await prisma.member.create({
      data: {
        name: memberData.name,
        branch: memberData.branch,
        monthlyAmount: MONTHLY_AMOUNT,
        joinDate: new Date(`${joinYear}-01-01`),
        isActive: true,
      },
    })

    // Create login account for this member
    await prisma.user.create({
      data: {
        email,
        passwordHash: memberPassword,
        name: memberData.name,
        role: "MEMBER",
        memberId: member.id,
      },
    })

    // Build all receipts for this member in one batch
    const receipts: {
      date: Date
      amount: number
      forMonth: string
      narration: string
      memberId: string
      fundId: string
    }[] = []

    for (let y = 0; y < YEARS.length; y++) {
      const payment = memberData.payments[y]
      if (payment === null) continue

      const year = YEARS[y]
      const totalAmount = payment === "full" ? 12 * MONTHLY_AMOUNT : payment
      const monthlyAmounts = spreadAmount(totalAmount, MONTHLY_AMOUNT)

      for (let m = 0; m < monthlyAmounts.length; m++) {
        const month = m + 1
        receipts.push({
          date: new Date(year, month - 1, 15),
          amount: monthlyAmounts[m],
          forMonth: `${year}-${String(month).padStart(2, "0")}`,
          narration:
            monthlyAmounts[m] === MONTHLY_AMOUNT
              ? "Monthly contribution"
              : "Partial payment",
          memberId: member.id,
          fundId: defaultFund.id,
        })
      }
    }

    if (receipts.length > 0) {
      await prisma.receipt.createMany({ data: receipts })
    }

    console.log(
      `  Member ${i + 1}/${members.length}: ${memberData.name} - ${memberData.branch} | ${email} (${receipts.length} receipts)`
    )
  }

  console.log(`\nSeeded ${members.length} members with receipts.`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
