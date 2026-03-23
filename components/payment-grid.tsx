"use client"

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MONTH_SHORT } from "@/lib/constants"
import { formatCurrency } from "@/lib/format"

type Receipt = {
  forMonth: string
  amount: number
}

type Props = {
  receipts: Receipt[]
  monthlyAmount: number
  joinDate: Date
  fundType?: "FIXED" | "OPEN"
  title?: string
}

export function PaymentGrid({
  receipts,
  monthlyAmount,
  joinDate,
  fundType = "FIXED",
  title = "Payment Grid",
}: Props) {
  // Build a map of month -> total paid
  const paidMap = new Map<string, number>()
  for (const r of receipts) {
    paidMap.set(r.forMonth, (paidMap.get(r.forMonth) || 0) + r.amount)
  }

  // Get all years from joinDate to now
  const startYear = new Date(joinDate).getFullYear()
  const startMonth = new Date(joinDate).getMonth()
  const now = new Date()
  const endYear = now.getFullYear()
  const endMonth = now.getMonth()

  const years: { year: number; months: number[] }[] = []
  for (let y = startYear; y <= endYear; y++) {
    const mStart = y === startYear ? startMonth : 0
    const mEnd = y === endYear ? endMonth : 11
    const months: number[] = []
    for (let m = mStart; m <= mEnd; m++) {
      months.push(m)
    }
    years.push({ year: y, months })
  }

  const getStatus = (year: number, month: number) => {
    const key = `${year}-${String(month + 1).padStart(2, "0")}`
    const paid = paidMap.get(key) || 0
    if (fundType === "OPEN") {
      return paid > 0 ? "contributed" : "none"
    }
    if (paid >= monthlyAmount) return "paid"
    if (paid > 0) return "partial"
    return "unpaid"
  }

  const getAmount = (year: number, month: number) => {
    const key = `${year}-${String(month + 1).padStart(2, "0")}`
    return paidMap.get(key) || 0
  }

  const statusColors: Record<string, string> = {
    paid: "bg-emerald-500 dark:bg-emerald-600 ring-emerald-500/20",
    partial: "bg-yellow-500 dark:bg-yellow-600 ring-yellow-500/20",
    unpaid: "bg-red-400 dark:bg-red-600 ring-red-400/20",
    contributed: "bg-emerald-500 dark:bg-emerald-600 ring-emerald-500/20",
    none: "bg-muted ring-muted-foreground/10",
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>{title}</CardTitle>
        <div className="flex gap-4 text-xs text-muted-foreground">
          {fundType === "OPEN" ? (
            <>
              <div className="flex items-center gap-1.5">
                <div className="size-2.5 rounded-full bg-emerald-500" />
                <span>Contributed</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="size-2.5 rounded-full bg-muted" />
                <span>No contribution</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1.5">
                <div className="size-2.5 rounded-full bg-emerald-500" />
                <span>Paid</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="size-2.5 rounded-full bg-yellow-500" />
                <span>Partial</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="size-2.5 rounded-full bg-red-400" />
                <span>Unpaid</span>
              </div>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {years.map(({ year, months }) => (
            <div key={year} className="flex items-center gap-3">
              <span className="text-muted-foreground w-12 shrink-0 text-xs font-semibold tabular-nums">
                {year}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {months.map((m) => {
                  const status = getStatus(year, m)
                  const amount = getAmount(year, m)
                  return (
                    <Tooltip key={m}>
                      <TooltipTrigger>
                        <div
                          className={`flex size-10 items-center justify-center rounded-md text-xs font-medium ring-1 ring-inset transition-transform hover:scale-110 ${status === "none" ? "text-muted-foreground" : "text-white"} ${statusColors[status]}`}
                        >
                          {MONTH_SHORT[m].substring(0, 3)}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-medium">
                          {MONTH_SHORT[m]} {year}
                        </p>
                        <p className="text-xs">
                          {amount > 0
                            ? `${fundType === "OPEN" ? "Contributed" : "Paid"}: ${formatCurrency(amount)}`
                            : fundType === "OPEN"
                              ? "No contribution"
                              : "Not paid"}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
