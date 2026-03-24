import Link from "next/link"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import { Plus, ListChecks } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getReceipts } from "@/lib/actions/receipts"
import { ReceiptsDataTable } from "@/components/receipts-table/data-table"
import { columns } from "@/components/receipts-table/columns"
import { DateFilter } from "@/components/date-filter"
import { ExportButtons } from "@/components/export-buttons"
import { format, startOfMonth, subMonths, endOfMonth } from "date-fns"

export default async function ReceiptsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>
}) {
  const { from, to } = await searchParams
  if (!from && !to) {
    const now = new Date()
    const start = subMonths(now, 2)
    redirect(`/receipts?from=${format(startOfMonth(start), "yyyy-MM-dd")}&to=${format(endOfMonth(now), "yyyy-MM-dd")}`)
  }
  const receipts = await getReceipts(from, to)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Receipts</h1>
          <p className="text-muted-foreground mt-1">
            Track income from member contributions.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ExportButtons
            endpoint="/api/export/receipts"
            searchParams={`${from ? `from=${from}` : ""}${to ? `&to=${to}` : ""}`}
          />
          <Button variant="outline" size="sm" render={<Link href="/receipts/batch" />}>
              <ListChecks className="mr-2 size-4" />
              Batch Entry
          </Button>
          <Button size="sm" render={<Link href="/receipts/new" />}>
              <Plus className="mr-2 size-4" />
              Add Receipt
          </Button>
        </div>
      </div>
      <Suspense>
        <DateFilter />
      </Suspense>
      <ReceiptsDataTable columns={columns} data={receipts} />
    </div>
  )
}
