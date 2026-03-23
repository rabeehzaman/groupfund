"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search, ChevronRight } from "lucide-react"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useIsMobile } from "@/hooks/use-mobile"
import { formatCurrency } from "@/lib/format"
import type { FundRow } from "./columns"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

export function DataTable<TData extends { id: string }, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const router = useRouter()
  const isMobile = useIsMobile()
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState("")

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    state: { sorting, globalFilter },
  })

  const filteredRows = table.getFilteredRowModel().rows

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
        <Input
          placeholder="Search funds..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="pl-9"
        />
      </div>

      {isMobile ? (
        <div className="space-y-2">
          {filteredRows.length ? (
            filteredRows.map((row) => {
              const fund = row.original as unknown as FundRow
              return (
                <div
                  key={row.id}
                  className="flex items-center gap-3 rounded-lg border p-3 active:bg-muted/50"
                  onClick={() => router.push(`/funds/${fund.id}/edit`)}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">{fund.name}</span>
                      <Badge
                        variant={fund.type === "FIXED" ? "default" : "secondary"}
                        className="shrink-0"
                      >
                        {fund.type === "FIXED" ? "Fixed" : "Open"}
                      </Badge>
                      {fund.isDefault && (
                        <Badge variant="outline" className="shrink-0 text-xs">
                          Default
                        </Badge>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      {fund.type === "FIXED" && fund.amount ? (
                        <span>{formatCurrency(fund.amount)}/member</span>
                      ) : fund.goalAmount ? (
                        <span>Goal: {formatCurrency(fund.goalAmount)}</span>
                      ) : (
                        <span>Open contribution</span>
                      )}
                      <span>&middot;</span>
                      <span>{fund.isRecurring ? "Monthly" : "One-time"}</span>
                      <span>&middot;</span>
                      <span>{fund._count.receipts} receipts</span>
                    </div>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </div>
              )
            })
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No funds found.
            </p>
          )}
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="cursor-pointer select-none"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      {{
                        asc: " \u2191",
                        desc: " \u2193",
                      }[header.column.getIsSorted() as string] ?? null}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer transition-colors hover:bg-muted/50"
                    onClick={() =>
                      router.push(`/funds/${row.original.id}/edit`)
                    }
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No funds found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <p className="text-muted-foreground text-sm">
        {filteredRows.length} fund(s)
      </p>
    </div>
  )
}
