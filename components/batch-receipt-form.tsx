"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { toast } from "sonner"
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createBatchReceipts } from "@/lib/actions/receipts"
import { getCurrentMonthKey, formatCurrency } from "@/lib/format"
import { MONTH_SHORT } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"

type Member = {
  id: string
  name: string
  branch: string
  monthlyAmount: number
}

type Fund = {
  id: string
  name: string
  type: "FIXED" | "OPEN"
  amount: number | null
}

type Entry = {
  memberId: string
  selected: boolean
  amount: number
  narration: string
}

export function BatchReceiptForm({
  members,
  funds,
}: {
  members: Member[]
  funds: Fund[]
}) {
  const router = useRouter()
  const isMobile = useIsMobile()
  const defaultFund = funds.find((f) => f.type === "FIXED") ?? funds[0]
  const [fundId, setFundId] = useState(defaultFund?.id ?? "")
  const selectedFund = funds.find((f) => f.id === fundId)
  const [date, setDate] = useState<Date>(new Date())
  const [forMonth, setForMonth] = useState(getCurrentMonthKey())
  const [dateOpen, setDateOpen] = useState(false)
  const [monthOpen, setMonthOpen] = useState(false)
  const [viewYear, setViewYear] = useState(new Date().getFullYear())
  const selectedMonthIdx = forMonth ? Number(forMonth.split("-")[1]) - 1 : -1
  const selectedMonthYear = forMonth ? Number(forMonth.split("-")[0]) : -1
  const [isPending, setIsPending] = useState(false)

  const getDefaultAmount = (member: Member, fund?: Fund) => {
    if (fund?.type === "FIXED" && fund.amount) return fund.amount
    if (fund?.type === "OPEN") return 0
    return member.monthlyAmount
  }

  const getDefaultNarration = (fund?: Fund) => {
    return fund?.name ?? "Monthly contribution"
  }

  const [entries, setEntries] = useState<Entry[]>(
    members.map((m) => ({
      memberId: m.id,
      selected: true,
      amount: getDefaultAmount(m, selectedFund),
      narration: getDefaultNarration(selectedFund),
    }))
  )

  const handleFundChange = (newFundId: string | null) => {
    if (!newFundId) return
    setFundId(newFundId)
    const fund = funds.find((f) => f.id === newFundId)
    setEntries(
      entries.map((e, i) => ({
        ...e,
        amount: getDefaultAmount(members[i], fund),
        narration: getDefaultNarration(fund),
      }))
    )
  }

  const selectedEntries = entries.filter((e) => e.selected)
  const totalAmount = selectedEntries.reduce((sum, e) => sum + e.amount, 0)

  const toggleAll = (checked: boolean) => {
    setEntries(entries.map((e) => ({ ...e, selected: checked })))
  }

  const updateEntry = (index: number, updates: Partial<Entry>) => {
    setEntries(
      entries.map((e, i) => (i === index ? { ...e, ...updates } : e))
    )
  }

  const handleSubmit = async () => {
    if (selectedEntries.length === 0) {
      toast.error("Select at least one member")
      return
    }

    setIsPending(true)
    try {
      const result = await createBatchReceipts({
        date: date.toISOString(),
        forMonth,
        fundId,
        entries: selectedEntries.map((e) => ({
          memberId: e.memberId,
          amount: e.amount,
          narration: e.narration,
        })),
      })

      if (result.success) {
        toast.success(`Created ${result.count} receipts`)
        router.push("/receipts")
      }
    } catch {
      toast.error("Failed to create receipts")
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Batch Receipt Entry</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 md:max-w-2xl">
          <div className="space-y-2">
            <Label>Date</Label>
            <Popover open={dateOpen} onOpenChange={setDateOpen}>
              <PopoverTrigger
                render={
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  />
                }
              >
                <CalendarIcon className="mr-2 size-4" />
                {format(date, "PPP")}
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => {
                    if (d) setDate(d)
                    setDateOpen(false)
                  }}
                  defaultMonth={date}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label>For Month</Label>
            <Popover open={monthOpen} onOpenChange={setMonthOpen}>
              <PopoverTrigger
                render={
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  />
                }
              >
                <CalendarIcon className="mr-2 size-4" />
                {MONTH_SHORT[selectedMonthIdx]} {selectedMonthYear}
              </PopoverTrigger>
              <PopoverContent className="w-64 p-3" align="start">
                <div className="flex items-center justify-between pb-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setViewYear((y) => y - 1)}
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <span className="text-sm font-semibold">{viewYear}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setViewYear((y) => y + 1)}
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {MONTH_SHORT.map((m, i) => {
                    const isSelected =
                      selectedMonthYear === viewYear &&
                      selectedMonthIdx === i
                    return (
                      <Button
                        key={m}
                        variant={isSelected ? "default" : "ghost"}
                        size="sm"
                        className="h-8"
                        onClick={() => {
                          setForMonth(
                            `${viewYear}-${String(i + 1).padStart(2, "0")}`
                          )
                          setMonthOpen(false)
                        }}
                      >
                        {m}
                      </Button>
                    )
                  })}
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label>Fund</Label>
            <Select value={fundId} onValueChange={(v) => v && handleFundChange(v)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a fund">
                  {fundId
                    ? (() => {
                        const f = funds.find((f) => f.id === fundId)
                        return f
                          ? `${f.name} (${f.type === "FIXED" ? "Fixed" : "Open"})`
                          : "Select a fund"
                      })()
                    : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {funds.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name} ({f.type === "FIXED" ? "Fixed" : "Open"})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isMobile ? (
          /* Mobile: stacked cards */
          <div className="space-y-3">
            <div className="flex items-center gap-3 px-1">
              <Checkbox
                checked={entries.every((e) => e.selected)}
                onCheckedChange={(checked) => toggleAll(!!checked)}
              />
              <span className="text-sm font-medium">Select All</span>
            </div>
            {entries.map((entry, i) => (
              <div
                key={entry.memberId}
                className={cn(
                  "rounded-lg border p-3 transition-colors",
                  entry.selected ? "bg-background" : "bg-muted/30 opacity-60"
                )}
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={entry.selected}
                    onCheckedChange={(checked) =>
                      updateEntry(i, { selected: !!checked })
                    }
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-medium">{members[i].name}</span>
                    {members[i].branch && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {members[i].branch}
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 pl-8">
                  <div className="space-y-1">
                    <Label className="text-xs">Amount</Label>
                    <Input
                      type="number"
                      min="0"
                      value={entry.amount}
                      onChange={(e) =>
                        updateEntry(i, { amount: Number(e.target.value) })
                      }
                      className="h-9"
                      disabled={!entry.selected}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Narration</Label>
                    <Input
                      value={entry.narration}
                      onChange={(e) =>
                        updateEntry(i, { narration: e.target.value })
                      }
                      className="h-9"
                      disabled={!entry.selected}
                      placeholder="Notes"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Desktop: table */
          <div className="rounded-lg border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-3 text-left">
                    <Checkbox
                      checked={entries.every((e) => e.selected)}
                      onCheckedChange={(checked) => toggleAll(!!checked)}
                    />
                  </th>
                  <th className="p-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Member</th>
                  <th className="p-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Branch</th>
                  <th className="p-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Amount</th>
                  <th className="p-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Narration
                  </th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, i) => (
                  <tr key={entry.memberId} className={`border-b transition-colors ${entry.selected ? "bg-background" : "bg-muted/30 opacity-60"}`}>
                    <td className="p-3">
                      <Checkbox
                        checked={entry.selected}
                        onCheckedChange={(checked) =>
                          updateEntry(i, { selected: !!checked })
                        }
                      />
                    </td>
                    <td className="p-3 text-sm font-medium">
                      {members[i].name}
                    </td>
                    <td className="text-muted-foreground p-3 text-sm">
                      {members[i].branch || "-"}
                    </td>
                    <td className="p-3">
                      <Input
                        type="number"
                        min="0"
                        value={entry.amount}
                        onChange={(e) =>
                          updateEntry(i, { amount: Number(e.target.value) })
                        }
                        className="h-8 w-24"
                        disabled={!entry.selected}
                      />
                    </td>
                    <td className="p-3">
                      <Input
                        value={entry.narration}
                        onChange={(e) =>
                          updateEntry(i, { narration: e.target.value })
                        }
                        className="h-8"
                        disabled={!entry.selected}
                        placeholder="Notes"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-6 text-sm">
            <div>
              <span className="text-muted-foreground">Selected: </span>
              <span className="font-semibold">{selectedEntries.length} members</span>
            </div>
            <div>
              <span className="text-muted-foreground">Total: </span>
              <span className="font-semibold text-emerald-600">{formatCurrency(totalAmount)}</span>
            </div>
          </div>
          <Button onClick={handleSubmit} disabled={isPending} className="w-full sm:w-auto">
            {isPending
              ? "Saving..."
              : `Save ${selectedEntries.length} Receipts`}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
