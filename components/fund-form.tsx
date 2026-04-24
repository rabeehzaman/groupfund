"use client"

import { useState } from "react"
import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DatePicker } from "@/components/date-picker"
import { createFund, updateFund } from "@/lib/actions/funds"

type Fund = {
  id: string
  name: string
  type: "FIXED" | "OPEN"
  amount: number | null
  yearlyAmount: number | null
  goalAmount: number | null
  description: string
  purpose: string
  isRecurring: boolean
  isDefault: boolean
  isChitFund: boolean
  appliesToAllMembers: boolean
  memberIds?: string[]
  startDate: Date | null
}

type MemberOption = { id: string; name: string; branch: string }

export function FundForm({
  fund,
  members,
}: {
  fund?: Fund
  members: MemberOption[]
}) {
  const action = fund ? updateFund.bind(null, fund.id) : createFund

  const [state, formAction, isPending] = useActionState(action, null)
  const [type, setType] = useState<"FIXED" | "OPEN">(fund?.type ?? "FIXED")
  const [isRecurring, setIsRecurring] = useState(fund?.isRecurring ?? true)
  const [isChitFund, setIsChitFund] = useState(fund?.isChitFund ?? false)
  const [appliesToAll, setAppliesToAll] = useState(
    fund?.appliesToAllMembers ?? true,
  )
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(
    new Set(fund?.memberIds ?? []),
  )
  const [memberFilter, setMemberFilter] = useState("")

  const filteredMembers = members.filter((m) => {
    if (!memberFilter) return true
    const q = memberFilter.toLowerCase()
    return (
      m.name.toLowerCase().includes(q) ||
      (m.branch && m.branch.toLowerCase().includes(q))
    )
  })

  function toggleMember(id: string) {
    setSelectedMembers((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>{fund ? "Edit Fund" : "Create Fund"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              name="name"
              defaultValue={fund?.name}
              placeholder="e.g. Yearly Contribution, Onam Party Fund"
              required
            />
            {state?.error?.name && (
              <p className="text-destructive text-sm">
                {state.error.name[0]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Type *</Label>
            <input type="hidden" name="type" value={type} />
            <Select
              defaultValue={type}
              onValueChange={(v) => setType(v as "FIXED" | "OPEN")}
              disabled={fund?.isDefault}
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  {type === "FIXED"
                    ? "Fixed - Set amount per member"
                    : "Open - Members contribute any amount"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FIXED">
                  Fixed - Set amount per member
                </SelectItem>
                <SelectItem value="OPEN">
                  Open - Members contribute any amount
                </SelectItem>
              </SelectContent>
            </Select>
            {fund?.isDefault && (
              <p className="text-muted-foreground text-xs">
                Type cannot be changed for the default fund.
              </p>
            )}
          </div>

          {type === "FIXED" && (
            <div className="space-y-2">
              <Label htmlFor="yearlyAmount">Yearly Amount per Member *</Label>
              <Input
                id="yearlyAmount"
                name="yearlyAmount"
                type="number"
                min="0"
                step="0.01"
                defaultValue={fund?.yearlyAmount ?? ""}
                placeholder="e.g. 3000"
                required
              />
              <p className="text-muted-foreground text-xs">
                Total amount expected from each member per year. Members can pay in any installments.
              </p>
              {state?.error?.yearlyAmount && (
                <p className="text-destructive text-sm">
                  {state.error.yearlyAmount[0]}
                </p>
              )}
            </div>
          )}

          {type === "OPEN" && (
            <div className="space-y-2">
              <Label htmlFor="goalAmount">
                Fundraising Goal (optional)
              </Label>
              <Input
                id="goalAmount"
                name="goalAmount"
                type="number"
                min="0"
                step="0.01"
                defaultValue={fund?.goalAmount ?? ""}
                placeholder="e.g. 50000"
              />
              <p className="text-muted-foreground text-xs">
                Set a total collection goal to track progress. Leave empty for
                no goal.
              </p>
              {state?.error?.goalAmount && (
                <p className="text-destructive text-sm">
                  {state.error.goalAmount[0]}
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>Recurrence *</Label>
            <input
              type="hidden"
              name="isRecurring"
              value={String(isRecurring)}
            />
            <Select
              defaultValue={isRecurring ? "true" : "false"}
              onValueChange={(v) => setIsRecurring(v === "true")}
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  {isRecurring ? "Yearly (recurring)" : "One-time collection"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Yearly (recurring)</SelectItem>
                <SelectItem value="false">One-time collection</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Start Date</Label>
            <DatePicker
              name="startDate"
              defaultValue={fund?.startDate ? new Date(fund.startDate) : undefined}
            />
            <p className="text-muted-foreground text-xs">
              When this fund starts collecting. Pending amounts are calculated from this date.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="purpose">Purpose</Label>
            <Textarea
              id="purpose"
              name="purpose"
              defaultValue={fund?.purpose}
              placeholder="What will the collected fund be used for? e.g. Annual trip, Emergency aid, Event expenses"
              rows={2}
            />
            <p className="text-muted-foreground text-xs">
              Specify the intended use of this fund so members know where their money goes.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={fund?.description}
              placeholder="Optional description of this fund"
              rows={2}
            />
          </div>

          <div className="flex items-start gap-3 rounded-md border p-3">
            <input type="hidden" name="isChitFund" value={String(isChitFund)} />
            <Checkbox
              id="isChitFund"
              checked={isChitFund}
              onCheckedChange={(checked) => setIsChitFund(!!checked)}
            />
            <div className="space-y-1">
              <Label htmlFor="isChitFund" className="cursor-pointer">
                This is the Chit Fund
              </Label>
              <p className="text-muted-foreground text-xs">
                Contributions to this fund appear on the Chit Fund dashboard.
                Only one fund can be marked as the chit fund.
              </p>
              {state?.error?.isChitFund && (
                <p className="text-destructive text-sm">
                  {state.error.isChitFund[0]}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-3 rounded-md border p-3">
            <div className="flex items-start gap-3">
              <input
                type="hidden"
                name="appliesToAllMembers"
                value={String(appliesToAll)}
              />
              <Checkbox
                id="appliesToAllMembers"
                checked={appliesToAll}
                onCheckedChange={(checked) => setAppliesToAll(!!checked)}
                disabled={fund?.isDefault}
              />
              <div className="space-y-1">
                <Label htmlFor="appliesToAllMembers" className="cursor-pointer">
                  Applies to all members
                </Label>
                <p className="text-muted-foreground text-xs">
                  Uncheck to limit this fund to specific members only
                  (e.g. an admission fund charged only to new admissions).
                </p>
                {fund?.isDefault && (
                  <p className="text-muted-foreground text-xs">
                    The default fund always applies to all members.
                  </p>
                )}
              </div>
            </div>

            {!appliesToAll && !fund?.isDefault && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">
                    Selected members ({selectedMembers.size})
                  </Label>
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-foreground"
                    onClick={() =>
                      setSelectedMembers(
                        selectedMembers.size === members.length
                          ? new Set()
                          : new Set(members.map((m) => m.id)),
                      )
                    }
                  >
                    {selectedMembers.size === members.length
                      ? "Clear all"
                      : "Select all"}
                  </button>
                </div>
                <Input
                  type="text"
                  placeholder="Search members..."
                  value={memberFilter}
                  onChange={(e) => setMemberFilter(e.target.value)}
                  className="h-8"
                />
                <div className="max-h-60 space-y-1 overflow-y-auto rounded-md border p-2">
                  {Array.from(selectedMembers).map((id) => (
                    <input key={id} type="hidden" name="memberIds" value={id} />
                  ))}
                  {filteredMembers.length === 0 ? (
                    <p className="py-4 text-center text-xs text-muted-foreground">
                      No members match.
                    </p>
                  ) : (
                    filteredMembers.map((m) => (
                      <label
                        key={m.id}
                        className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1 hover:bg-accent"
                      >
                        <Checkbox
                          checked={selectedMembers.has(m.id)}
                          onCheckedChange={() => toggleMember(m.id)}
                        />
                        <span className="text-sm">
                          {m.name}
                          {m.branch && (
                            <span className="text-muted-foreground">
                              {" "}
                              · {m.branch}
                            </span>
                          )}
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : fund ? "Update" : "Create Fund"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
