import "dotenv/config"
import { PrismaNeon } from "@prisma/adapter-neon"
import { PrismaClient } from "@prisma/client"

async function main() {
  const adapter = new PrismaNeon({
    connectionString: process.env.DATABASE_URL,
  })
  const db = new PrismaClient({ adapter })

  // Check if default fund already exists
  const existing = await db.fund.findFirst({ where: { isDefault: true } })
  if (existing) {
    console.log("Default fund already exists:", existing.name)
  } else {
    // Get settings for the default monthly amount
    const settings = await db.settings.findUnique({
      where: { id: "default" },
    })
    const amount = settings?.defaultMonthlyAmount ?? 1000

    const fund = await db.fund.create({
      data: {
        name: "Monthly Contribution",
        type: "FIXED",
        amount,
        isRecurring: true,
        isDefault: true,
        isActive: true,
      },
    })
    console.log("Created default fund:", fund.name, "with amount:", amount)
  }

  // Backfill receipts that have no fundId
  const defaultFund = await db.fund.findFirst({ where: { isDefault: true } })
  if (!defaultFund) {
    console.error("No default fund found!")
    process.exit(1)
  }

  const updated = await db.receipt.updateMany({
    where: { fundId: "" },
    data: { fundId: defaultFund.id },
  })
  console.log(`Backfilled ${updated.count} receipts with default fund ID`)

  await db.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
