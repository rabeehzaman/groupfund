"use client"

import { ColumnDef } from "@tanstack/react-table"
import { formatCurrency, formatDate, formatMonthYear } from "@/lib/format"

export type ReceiptRow = {
  id: string
  date: Date
  amount: number
  forMonth: string
  narration: string
  member: { name: string; branch: string }
  fund: { name: string }
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
    cell: ({ row }) => formatMonthYear(row.getValue("forMonth")),
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
    accessorKey: "narration",
    header: "Narration",
    cell: ({ row }) => (
      <span className="text-muted-foreground max-w-[200px] truncate">
        {row.getValue("narration") || "-"}
      </span>
    ),
  },
]
