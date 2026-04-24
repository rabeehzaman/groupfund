import { notFound } from "next/navigation"
import { getFund } from "@/lib/actions/funds"
import { FundForm } from "@/components/fund-form"
import { FundDeleteButton } from "./fund-delete-button"
import { supabase } from "@/lib/supabase"
import { requireAdmin } from "@/lib/auth-utils"

export default async function EditFundPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params
  const fund = await getFund(id)

  if (!fund) notFound()

  const { data: members, error } = await supabase
    .from("Member")
    .select("id, name, branch")
    .eq("isActive", true)
    .order("name")
  if (error) throw error

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit Fund</h1>
        {!fund.isDefault && (
          <FundDeleteButton
            fundId={id}
            hasReceipts={fund._count.receipts > 0}
            receiptCount={fund._count.receipts}
          />
        )}
      </div>
      <FundForm fund={fund} members={members ?? []} />
    </div>
  )
}
