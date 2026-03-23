import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getMembers } from "@/lib/actions/members"
import { DataTable } from "@/components/members-table/data-table"
import { columns } from "@/components/members-table/columns"

export default async function MembersPage() {
  const members = await getMembers()

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Members</h1>
          <p className="text-muted-foreground mt-1">
            Manage group fund members.
          </p>
        </div>
        <Button size="sm" render={<Link href="/members/new" />}>
            <Plus className="mr-2 size-4" />
            Add Member
        </Button>
      </div>
      <DataTable columns={columns} data={members} />
    </div>
  )
}
