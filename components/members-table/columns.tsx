"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/format"

export type MemberRow = {
  id: string
  name: string
  branch: string
  monthlyAmount: number
  isActive: boolean
  _count: { receipts: number }
}

export const columns: ColumnDef<MemberRow>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue("name")}</span>
    ),
  },
  {
    accessorKey: "branch",
    header: "Branch",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.getValue("branch") || "-"}
      </span>
    ),
  },
  {
    accessorKey: "monthlyAmount",
    header: "Monthly",
    cell: ({ row }) => formatCurrency(row.getValue("monthlyAmount")),
  },
  {
    accessorKey: "_count.receipts",
    header: "Payments",
    cell: ({ row }) => row.original._count.receipts,
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => {
      const isActive = row.getValue("isActive")
      return (
        <div className="flex items-center gap-2">
          <div className={`size-2 rounded-full ${isActive ? "bg-emerald-500" : "bg-muted-foreground/40"}`} />
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      )
    },
  },
]
