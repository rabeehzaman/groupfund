import { BatchReceiptForm } from "@/components/batch-receipt-form"
import { getMembers } from "@/lib/actions/members"
import { getActiveFunds } from "@/lib/actions/funds"

export default async function BatchReceiptPage() {
  const [members, funds] = await Promise.all([getMembers(), getActiveFunds()])
  const activeMembers = members
    .filter((m) => m.isActive)
    .map((m) => ({
      id: m.id,
      name: m.name,
      branch: m.branch,
      monthlyAmount: m.monthlyAmount,
    }))

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Batch Receipt Entry</h1>
      <p className="text-muted-foreground">
        Enter receipts for multiple members at once.
      </p>
      <BatchReceiptForm
        members={activeMembers}
        funds={funds.map((f) => ({
          id: f.id,
          name: f.name,
          type: f.type,
          amount: f.amount,
        }))}
      />
    </div>
  )
}
