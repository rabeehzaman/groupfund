"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate, formatMonthYear } from "@/lib/format"

export type ReceiptRow = {
  id: string
  date: Date
  amount: number
  forMonth: string | null
  narration: string
  status: "PENDING" | "VERIFIED" | "REJECTED"
  proofUrl: string | null
  member: { name: string; branch: string }
  fund: { name: string }
}

const statusBadge = {
  PENDING: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200",
  VERIFIED: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-900 dark:text-emerald-200",
  REJECTED: "bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900 dark:text-red-200",
}

export const columns: ColumnDef<ReceiptRow>[] = [
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => formatDate(row.getValue("date")),
  },
  {
    accessorFn: (row) => row.member.name,
    id: "memberName",
    header: "Member",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.member.name}</span>
    ),
  },
  {
    accessorFn: (row) => row.fund.name,
    id: "fundName",
    header: "Fund",
    cell: ({ row }) => (
      <span className="text-muted-foreground">{row.original.fund.name}</span>
    ),
  },
  {
    accessorKey: "forMonth",
    header: "For Month",
    cell: ({ row }) => {
      const forMonth = row.getValue("forMonth") as string | null
      return forMonth ? formatMonthYear(forMonth) : "-"
    },
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => (
      <span className="font-semibold">
        {formatCurrency(row.getValue("amount"))}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status
      return (
        <Badge className={statusBadge[status]}>
          {status === "VERIFIED" ? "Verified" : status === "PENDING" ? "Pending" : "Rejected"}
        </Badge>
      )
    },
  },
  {
    accessorKey: "narration",
    header: "Narration",
    cell: ({ row }) => (
      <span className="text-muted-foreground max-w-[200px] truncate">
        {row.getValue("narration") || "-"}
      </span>
    ),
  },
]
