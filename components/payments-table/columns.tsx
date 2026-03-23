"use client"

import { ColumnDef } from "@tanstack/react-table"
import { formatCurrency, formatDate } from "@/lib/format"

export type PaymentRow = {
  id: string
  date: Date
  amount: number
  purpose: string
  paidTo: string
  narration: string
}

export const columns: ColumnDef<PaymentRow>[] = [
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => formatDate(row.getValue("date")),
  },
  {
    accessorKey: "purpose",
    header: "Purpose",
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue("purpose")}</span>
    ),
  },
  {
    accessorKey: "paidTo",
    header: "Paid To",
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
      <span className="text-muted-foreground">
        {row.getValue("narration") || "-"}
      </span>
    ),
  },
]
