import { ReceiptForm } from "@/components/receipt-form"
import { getMembers } from "@/lib/actions/members"
import { getActiveFunds } from "@/lib/actions/funds"

export default async function NewReceiptPage({
  searchParams,
}: {
  searchParams: Promise<{ memberId?: string }>
}) {
  const { memberId } = await searchParams
  const [members, funds] = await Promise.all([getMembers(), getActiveFunds()])

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Add Receipt</h1>
      <ReceiptForm
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
        }))}
        defaultMemberId={memberId}
      />
    </div>
  )
}
