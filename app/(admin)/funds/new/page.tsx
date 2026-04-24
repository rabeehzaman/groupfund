import { FundForm } from "@/components/fund-form"
import { supabase } from "@/lib/supabase"
import { requireAdmin } from "@/lib/auth-utils"

export default async function NewFundPage() {
  await requireAdmin()
  const { data: members, error } = await supabase
    .from("Member")
    .select("id, name, branch")
    .eq("isActive", true)
    .order("name")
  if (error) throw error

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Create Fund</h1>
      <FundForm members={members ?? []} />
    </div>
  )
}
