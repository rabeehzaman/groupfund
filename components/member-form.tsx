"use client"

import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createMember, updateMember } from "@/lib/actions/members"

type Member = {
  id: string
  name: string
  branch: string
  monthlyAmount: number
  isActive: boolean
}

export function MemberForm({ member }: { member?: Member }) {
  const action = member
    ? updateMember.bind(null, member.id)
    : createMember

  const [state, formAction, isPending] = useActionState(action, null)

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>{member ? "Edit Member" : "Add Member"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              name="name"
              defaultValue={member?.name}
              placeholder="Enter member name"
              required
            />
            {state?.error?.name && (
              <p className="text-destructive text-sm">{state.error.name[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="branch">Branch / Area</Label>
            <Input
              id="branch"
              name="branch"
              defaultValue={member?.branch}
              placeholder="Enter branch or area"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="monthlyAmount">Monthly Amount</Label>
            <Input
              id="monthlyAmount"
              name="monthlyAmount"
              type="number"
              min="0"
              defaultValue={member?.monthlyAmount ?? 1000}
            />
          </div>

          {member && (
            <input
              type="hidden"
              name="isActive"
              value={String(member.isActive)}
            />
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : member ? "Update" : "Add Member"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
