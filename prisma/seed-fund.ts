import "dotenv/config"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  const { data: existing } = await supabase
    .from("Fund")
    .select("*")
    .eq("isDefault", true)
    .limit(1)
    .maybeSingle()

  if (existing) {
    console.log("Default fund already exists:", existing.name)
  } else {
    const { data: settings } = await supabase
      .from("Settings")
      .select("*")
      .eq("id", "default")
      .maybeSingle()

    const amount = settings?.defaultMonthlyAmount ?? 1000
    const ts = new Date().toISOString()

    const { data: fund, error } = await supabase
      .from("Fund")
      .insert({
        id: crypto.randomUUID(),
        name: "Monthly Contribution",
        type: "FIXED",
        amount,
        description: "",
        purpose: "",
        isRecurring: true,
        isDefault: true,
        isActive: true,
        createdAt: ts,
        updatedAt: ts,
      })
      .select()
      .single()

    if (error) throw error
    console.log("Created default fund:", fund.name, "with amount:", amount)
  }

  const { data: defaultFund } = await supabase
    .from("Fund")
    .select("*")
    .eq("isDefault", true)
    .limit(1)
    .single()

  if (!defaultFund) {
    console.error("No default fund found!")
    process.exit(1)
  }

  const { count } = await supabase
    .from("Receipt")
    .select("*", { count: "exact", head: true })
    .eq("fundId", "")

  console.log(`Found ${count ?? 0} receipts with empty fundId`)

  if ((count ?? 0) > 0) {
    const { error } = await supabase
      .from("Receipt")
      .update({ fundId: defaultFund.id })
      .eq("fundId", "")

    if (error) throw error
    console.log(`Backfilled receipts with default fund ID`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
