"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useState, useCallback, useTransition } from "react"
import { CalendarIcon } from "lucide-react"
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, subYears } from "date-fns"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const presets = [
  { value: "all", label: "All Time" },
  { value: "this-month", label: "This Month" },
  { value: "prev-month", label: "Previous Month" },
  { value: "last-3", label: "Last 3 Months" },
  { value: "last-6", label: "Last 6 Months" },
  { value: "this-year", label: "This Year" },
  { value: "last-year", label: "Last Year" },
  { value: "custom", label: "Custom Range" },
] as const

type PresetValue = (typeof presets)[number]["value"]

function getPresetRange(preset: PresetValue): { from: string; to: string } | null {
  const now = new Date()
  switch (preset) {
    case "all":
      return null
    case "this-month":
      return {
        from: format(startOfMonth(now), "yyyy-MM-dd"),
        to: format(endOfMonth(now), "yyyy-MM-dd"),
      }
    case "prev-month": {
      const prev = subMonths(now, 1)
      return {
        from: format(startOfMonth(prev), "yyyy-MM-dd"),
        to: format(endOfMonth(prev), "yyyy-MM-dd"),
      }
    }
    case "last-3": {
      const start = subMonths(now, 2)
      return {
        from: format(startOfMonth(start), "yyyy-MM-dd"),
        to: format(endOfMonth(now), "yyyy-MM-dd"),
      }
    }
    case "last-6": {
      const start = subMonths(now, 5)
      return {
        from: format(startOfMonth(start), "yyyy-MM-dd"),
        to: format(endOfMonth(now), "yyyy-MM-dd"),
      }
    }
    case "this-year":
      return {
        from: format(startOfYear(now), "yyyy-MM-dd"),
        to: format(endOfYear(now), "yyyy-MM-dd"),
      }
    case "last-year": {
      const lastYear = subYears(now, 1)
      return {
        from: format(startOfYear(lastYear), "yyyy-MM-dd"),
        to: format(endOfYear(lastYear), "yyyy-MM-dd"),
      }
    }
    default:
      return null
  }
}

function detectPreset(from: string | null, to: string | null): PresetValue {
  if (!from && !to) return "all"
  for (const preset of presets) {
    if (preset.value === "all" || preset.value === "custom") continue
    const range = getPresetRange(preset.value)
    if (range && range.from === from && range.to === to) return preset.value
  }
  return "custom"
}

export function DateFilter() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const from = searchParams.get("from")
  const to = searchParams.get("to")
  const currentPreset = detectPreset(from, to)

  const [customFrom, setCustomFrom] = useState<Date | undefined>(
    from ? new Date(from) : undefined
  )
  const [customTo, setCustomTo] = useState<Date | undefined>(
    to ? new Date(to) : undefined
  )
  const [popoverOpen, setPopoverOpen] = useState(false)

  const updateUrl = useCallback(
    (range: { from: string; to: string } | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (range) {
        params.set("from", range.from)
        params.set("to", range.to)
      } else {
        params.delete("from")
        params.delete("to")
      }
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`)
      })
    },
    [router, pathname, searchParams]
  )

  const handlePreset = (value: string | null) => {
    if (!value || value === "custom") return
    const range = getPresetRange(value as PresetValue)
    updateUrl(range)
  }

  const applyCustomRange = () => {
    if (customFrom && customTo) {
      updateUrl({
        from: format(customFrom, "yyyy-MM-dd"),
        to: format(customTo, "yyyy-MM-dd"),
      })
      setPopoverOpen(false)
    }
  }

  const displayLabel = currentPreset === "custom" && from && to
    ? `${format(new Date(from), "dd MMM yyyy")} - ${format(new Date(to), "dd MMM yyyy")}`
    : undefined

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={currentPreset} onValueChange={handlePreset}>
        <SelectTrigger className={`w-auto min-w-[140px] ${isPending ? "opacity-70" : ""}`}>
          <CalendarIcon className="mr-2 size-4" />
          <SelectValue placeholder="All Time">
            {presets.find((p) => p.value === currentPreset)?.label || "All Time"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {presets.filter((p) => p.value !== "custom").map((preset) => (
            <SelectItem key={preset.value} value={preset.value}>
              {preset.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger
          render={
            <Button
              variant={currentPreset === "custom" ? "default" : "outline"}
              size="sm"
              className="h-9"
            />
          }
        >
          <CalendarIcon className="mr-2 size-4" />
          {displayLabel || "Custom Range"}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-4" align="start">
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <p className="text-sm font-medium">From</p>
                <Calendar
                  mode="single"
                  selected={customFrom}
                  onSelect={setCustomFrom}
                  initialFocus
                />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">To</p>
                <Calendar
                  mode="single"
                  selected={customTo}
                  onSelect={setCustomTo}
                  disabled={(date) => customFrom ? date < customFrom : false}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCustomFrom(undefined)
                  setCustomTo(undefined)
                  setPopoverOpen(false)
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={applyCustomRange}
                disabled={!customFrom || !customTo}
              >
                Apply
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
