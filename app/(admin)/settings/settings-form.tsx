"use client"

import { useState } from "react"
import { useActionState, useEffect } from "react"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { updateSettings } from "@/lib/actions/settings"
import { MONTHS } from "@/lib/constants"

type Settings = {
  groupName: string
  defaultMonthlyAmount: number
  financialYearStart: number
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>Appearance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Label>Theme</Label>
          <Select value={theme} onValueChange={(v) => v && setTheme(v)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select theme" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Light</SelectItem>
              <SelectItem value="dark">Dark</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}

export function SettingsForm({ settings }: { settings: Settings }) {
  const [state, formAction, isPending] = useActionState(updateSettings, null)
  const [fyStart, setFyStart] = useState(String(settings.financialYearStart))

  useEffect(() => {
    if (state?.success) {
      toast.success("Settings updated")
    }
  }, [state])

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>Group Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="groupName">Group Name</Label>
            <Input
              id="groupName"
              name="groupName"
              defaultValue={settings.groupName}
            />
            {state?.error?.groupName && (
              <p className="text-destructive text-sm">
                {state.error.groupName[0]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="defaultMonthlyAmount">
              Default Monthly Amount
            </Label>
            <Input
              id="defaultMonthlyAmount"
              name="defaultMonthlyAmount"
              type="number"
              min="0"
              defaultValue={settings.defaultMonthlyAmount}
            />
          </div>

          <div className="space-y-2">
            <Label>Financial Year Start Month</Label>
            <input type="hidden" name="financialYearStart" value={fyStart} />
            <Select value={fyStart} onValueChange={(v) => setFyStart(v ?? "1")}>
              <SelectTrigger className="w-full">
                <SelectValue>
                  {MONTHS[Number(fyStart) - 1] || "January"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((month, i) => (
                  <SelectItem key={i} value={String(i + 1)}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Save Settings"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
