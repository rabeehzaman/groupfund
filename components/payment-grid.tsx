"use client"

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { MONTH_SHORT } from "@/lib/constants"
import { formatCurrency } from "@/lib/format"

type Receipt = {
  forMonth: string | null
  amount: number
}

type Props = {
  receipts: Receipt[]
  monthlyAmount: number
  joinDate: Date
  fundType?: "FIXED" | "OPEN"
  title?: string
  fundStartDate?: Date
  yearlyAmount?: number | null
}

export function PaymentGrid({
  receipts,
  monthlyAmount,
  joinDate,
  fundType = "FIXED",
  title = "Payment Grid",
  fundStartDate,
  yearlyAmount,
}: Props) {
  // If the fund has a yearly amount, show a simple progress view
  if (yearlyAmount && yearlyAmount > 0) {
    const totalPaid = receipts.reduce((sum, r) => sum + r.amount, 0)
    const pendingAmount = Math.max(0, yearlyAmount - totalPaid)
    const progress = Math.min((totalPaid / yearlyAmount) * 100, 100)
    const isPaid = totalPaid >= yearlyAmount

    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-muted-foreground text-xs">Expected</p>
              <p className="text-lg font-semibold">{formatCurrency(yearlyAmount)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Paid</p>
              <p className="text-lg font-semibold text-emerald-600">{formatCurrency(totalPaid)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Pending</p>
              <p className={`text-lg font-semibold ${isPaid ? "text-emerald-600" : "text-red-500"}`}>
                {isPaid ? "Paid" : formatCurrency(pendingAmount)}
              </p>
            </div>
          </div>
          {receipts.length > 0 && (
            <div className="text-muted-foreground text-xs text-center">
              {receipts.length} payment{receipts.length !== 1 ? "s" : ""} made
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // Legacy monthly grid view
  const paidMap = new Map<string, number>()
  for (const r of receipts) {
    if (r.forMonth) {
      paidMap.set(r.forMonth, (paidMap.get(r.forMonth) || 0) + r.amount)
    }
  }

  // Use the later of joinDate and fundStartDate as the grid start
  const effectiveStart = fundStartDate && new Date(fundStartDate) > new Date(joinDate)
    ? new Date(fundStartDate)
    : new Date(joinDate)

  const startYear = effectiveStart.getFullYear()
  const startMonth = effectiveStart.getMonth()
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
