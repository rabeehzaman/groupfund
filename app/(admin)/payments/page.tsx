import Link from "next/link"
import { Suspense } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getPayments } from "@/lib/actions/payments"
import { PaymentsDataTable } from "@/components/payments-table/data-table"
import { columns } from "@/components/payments-table/columns"
import { DateFilter } from "@/components/date-filter"
import { ExportButtons } from "@/components/export-buttons"

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>
}) {
  const { from, to } = await searchParams
  const payments = await getPayments(from, to)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Payments</h1>
          <p className="text-muted-foreground mt-1">
            Track group expenses and payouts.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ExportButtons
            endpoint="/api/export/payments"
            searchParams={`${from ? `from=${from}` : ""}${to ? `&to=${to}` : ""}`}
          />
          <Button size="sm" render={<Link href="/payments/new" />}>
              <Plus className="mr-2 size-4" />
              Add Payment
          </Button>
        </div>
      </div>
      <Suspense>
        <DateFilter />
      </Suspense>
      <PaymentsDataTable columns={columns} data={payments} />
    </div>
  )
}
