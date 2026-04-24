"use client"

import { useActionState, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DatePicker } from "@/components/date-picker"
import { createChitContribution } from "@/lib/actions/chit-fund"

type Member = { id: string; name: string; branch: string }

type State =
  | { success?: true; error?: Record<string, string[] | undefined> }
  | null

export function ChitContributionForm({ members }: { members: Member[] }) {
  const [state, formAction, isPending] = useActionState<State, FormData>(
    createChitContribution as any,
    null,
  )
  const [memberId, setMemberId] = useState("")
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.success) {
      toast.success("Chit contribution added")
      formRef.current?.reset()
      setMemberId("")
    }
  }, [state])

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label>Member *</Label>
        <input type="hidden" name="memberId" value={memberId} />
        <Select
          value={memberId || undefined}
          onValueChange={(v) => setMemberId(v ?? "")}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a member">
              {memberId
                ? (() => {
                    const m = members.find((m) => m.id === memberId)
                    return m ? `${m.name}${m.branch ? ` (${m.branch})` : ""}` : ""
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
          <p className="text-destructive text-sm">{state.error.memberId?.[0]}</p>
        )}
        {state?.error?.fundId && (
          <p className="text-destructive text-sm">{state.error.fundId?.[0]}</p>
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
          placeholder="Enter amount"
          required
        />
        {state?.error?.amount && (
          <p className="text-destructive text-sm">{state.error.amount?.[0]}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Date</Label>
        <DatePicker name="date" defaultValue={new Date()} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="narration">Narration</Label>
        <Textarea
          id="narration"
          name="narration"
          placeholder="Optional note"
          rows={2}
        />
      </div>

      <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
        <Send className="size-4" />
        {isPending ? "Saving..." : "Add Contribution"}
      </Button>
    </form>
  )
}
