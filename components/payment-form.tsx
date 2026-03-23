"use client"

import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DatePicker } from "@/components/date-picker"
import { createPayment, updatePayment } from "@/lib/actions/payments"

type Payment = {
  id: string
  date: Date
  amount: number
  purpose: string
  paidTo: string
  narration: string
}

export function PaymentForm({ payment }: { payment?: Payment }) {
  const action = payment
    ? updatePayment.bind(null, payment.id)
    : createPayment

  const [state, formAction, isPending] = useActionState(action, null)

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>{payment ? "Edit Payment" : "Add Payment"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label>Date *</Label>
            <DatePicker
              name="date"
              defaultValue={payment ? new Date(payment.date) : new Date()}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="purpose">Purpose *</Label>
            <Input
              id="purpose"
              name="purpose"
              defaultValue={payment?.purpose}
              placeholder="e.g. Hall rent, Event expense"
              required
            />
            {state?.error?.purpose && (
              <p className="text-destructive text-sm">
                {state.error.purpose[0]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="paidTo">Paid To *</Label>
            <Input
              id="paidTo"
              name="paidTo"
              defaultValue={payment?.paidTo}
              placeholder="Person or entity name"
              required
            />
            {state?.error?.paidTo && (
              <p className="text-destructive text-sm">
                {state.error.paidTo[0]}
              </p>
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
              defaultValue={payment?.amount}
              placeholder="0"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="narration">Narration</Label>
            <Textarea
              id="narration"
              name="narration"
              defaultValue={payment?.narration}
              placeholder="Optional notes"
              rows={2}
            />
          </div>

          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : payment ? "Update" : "Add Payment"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
