"use client"

import { useState } from "react"
import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DatePicker } from "@/components/date-picker"
import { MonthPicker } from "@/components/month-picker"
import { createReceipt, updateReceipt } from "@/lib/actions/receipts"
import { getCurrentMonthKey } from "@/lib/format"

type Receipt = {
  id: string
  date: Date
  amount: number
  forMonth: string | null
  narration: string
  memberId: string
  fundId: string
}

type Member = { id: string; name: string; branch: string }
type Fund = {
  id: string
  name: string
  type: "FIXED" | "OPEN"
  amount: number | null
  yearlyAmount: number | null
}

export function ReceiptForm({
  receipt,
  members,
  funds,
  defaultMemberId,
}: {
  receipt?: Receipt
  members: Member[]
  funds: Fund[]
  defaultMemberId?: string
}) {
  const action = receipt
    ? updateReceipt.bind(null, receipt.id)
    : createReceipt

  const [state, formAction, isPending] = useActionState(action, null)
  const [memberId, setMemberId] = useState(receipt?.memberId ?? defaultMemberId ?? "")
  const [fundId, setFundId] = useState(receipt?.fundId ?? (funds.length === 1 ? funds[0].id : ""))
  const selectedFund = funds.find((f) => f.id === fundId)
  const isYearlyFund = selectedFund?.yearlyAmount != null

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>{receipt ? "Edit Receipt" : "Add Receipt"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label>Member *</Label>
            <input type="hidden" name="memberId" value={memberId} />
            <Select
              defaultValue={memberId || undefined}
              onValueChange={(v) => setMemberId(v ?? "")}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a member">
                  {memberId
                    ? (() => {
                        const m = members.find((m) => m.id === memberId)
                        return m
                          ? `${m.name}${m.branch ? ` (${m.branch})` : ""}`
                          : "Select a member"
                      })()
                    : undefined}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name} {m.branch ? `(${m.branch})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {state?.error?.memberId && (
              <p className="text-destructive text-sm">
                {state.error.memberId[0]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Fund *</Label>
            <input type="hidden" name="fundId" value={fundId} />
            <Select
              defaultValue={fundId || undefined}
              onValueChange={(v) => setFundId(v ?? "")}
            >
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
            {state?.error?.fundId && (
              <p className="text-destructive text-sm">
                {state.error.fundId[0]}
              </p>
            )}
          </div>

          <div className={`grid grid-cols-1 gap-4 ${isYearlyFund ? "" : "sm:grid-cols-2"}`}>
            <div className="space-y-2">
              <Label>Date *</Label>
              <DatePicker
                name="date"
                defaultValue={receipt ? new Date(receipt.date) : new Date()}
              />
            </div>

            {!isYearlyFund && (
              <div className="space-y-2">
                <Label>For Month</Label>
                <MonthPicker
                  name="forMonth"
                  defaultValue={receipt?.forMonth || getCurrentMonthKey()}
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount *</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              min="0"
              step="0.01"
              defaultValue={receipt?.amount ?? ""}
              key={fundId}
              placeholder="Enter any amount"
              required
            />
            {selectedFund?.yearlyAmount && (
              <p className="text-muted-foreground text-xs">
                Yearly target: {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(selectedFund.yearlyAmount)}.
                Member can pay any amount at any time.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="narration">Narration</Label>
            <Textarea
              id="narration"
              name="narration"
              defaultValue={receipt?.narration}
              placeholder="Optional notes"
              rows={2}
            />
          </div>

          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : receipt ? "Update" : "Add Receipt"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
