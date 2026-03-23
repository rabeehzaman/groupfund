import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getFunds } from "@/lib/actions/funds"
import { DataTable } from "@/components/funds-table/data-table"
import { columns } from "@/components/funds-table/columns"

export default async function FundsPage() {
  const funds = await getFunds()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            Funds
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage fund gatherings and collections.
          </p>
        </div>
        <Button size="sm" render={<Link href="/funds/new" />}>
          <Plus className="mr-2 size-4" />
          Create Fund
        </Button>
      </div>
      <DataTable columns={columns} data={funds} />
    </div>
  )
}
