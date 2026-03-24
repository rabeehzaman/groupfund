"use client"

import Link from "next/link"
import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/format"

export type FundRow = {
  id: string
  name: string
  type: "FIXED" | "OPEN"
  amount: number | null
  goalAmount: number | null
  purpose: string
  isRecurring: boolean
  isActive: boolean
  isDefault: boolean
  _count: { receipts: number }
}

export const columns: ColumnDef<FundRow>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Link
          href={`/funds/${row.original.id}`}
          className="font-medium hover:underline"
        >
          {row.getValue("name")}
        </Link>
        {row.original.isDefault && (
          <Badge variant="outline" className="text-xs">
            Default
          </Badge>
        )}
      </div>
    ),
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const type = row.getValue("type") as string
      return (
        <Badge variant={type === "FIXED" ? "default" : "secondary"}>
          {type === "FIXED" ? "Fixed" : "Open"}
        </Badge>
      )
    },
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => {
      const fund = row.original
      if (fund.type === "FIXED" && fund.amount) {
        return formatCurrency(fund.amount) + " / member"
      }
      if (fund.type === "OPEN" && fund.goalAmount) {
        return "Goal: " + formatCurrency(fund.goalAmount)
      }
      return <span className="text-muted-foreground">-</span>
    },
  },
  {
    accessorKey: "purpose",
    header: "Purpose",
    cell: ({ row }) => {
      const purpose = row.original.purpose
      return purpose ? (
        <span className="max-w-[200px] truncate block" title={purpose}>
          {purpose}
        </span>
      ) : (
        <span className="text-muted-foreground">-</span>
      )
    },
  },
  {
    accessorKey: "isRecurring",
    header: "Recurrence",
    cell: ({ row }) =>
      row.getValue("isRecurring") ? "Monthly" : "One-time",
  },
  {
    accessorKey: "_count.receipts",
    header: "Receipts",
    cell: ({ row }) => row.original._count.receipts,
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => {
      const isActive = row.getValue("isActive")
      return (
        <div className="flex items-center gap-2">
          <div
            className={`size-2 rounded-full ${isActive ? "bg-emerald-500" : "bg-muted-foreground/40"}`}
          />
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? "Active" : "Inactive"}
          </Badge>
        </div>
      )
    },
  },
]
