import { notFound } from "next/navigation"
import { getReceipt } from "@/lib/actions/receipts"
import { getMembers } from "@/lib/actions/members"
import { getActiveFunds } from "@/lib/actions/funds"
import { ReceiptForm } from "@/components/receipt-form"
import { ReceiptDeleteButton } from "../receipt-delete-button"

export default async function EditReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [receipt, members, funds] = await Promise.all([
    getReceipt(id),
    getMembers(),
    getActiveFunds(),
  ])

  if (!receipt) notFound()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit Receipt</h1>
        <ReceiptDeleteButton receiptId={id} />
      </div>
      <ReceiptForm
        receipt={receipt}
        members={members.map((m) => ({
          id: m.id,
          name: m.name,
          branch: m.branch,
        }))}
        funds={funds.map((f) => ({
          id: f.id,
          name: f.name,
          type: f.type,
          amount: f.amount,
          yearlyAmount: f.yearlyAmount,
        }))}
      />
    </div>
  )
}
