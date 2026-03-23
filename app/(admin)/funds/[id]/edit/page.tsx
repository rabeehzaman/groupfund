import { notFound } from "next/navigation"
import { getFund } from "@/lib/actions/funds"
import { FundForm } from "@/components/fund-form"
import { FundDeleteButton } from "./fund-delete-button"

export default async function EditFundPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const fund = await getFund(id)

  if (!fund) notFound()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit Fund</h1>
        {!fund.isDefault && (
          <FundDeleteButton
            fundId={id}
            hasReceipts={fund._count.receipts > 0}
          />
        )}
      </div>
      <FundForm fund={fund} />
    </div>
  )
}
