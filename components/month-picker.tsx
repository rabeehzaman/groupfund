"use client"

import { useState } from "react"
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { MONTH_SHORT } from "@/lib/constants"

export function MonthPicker({
  name,
  defaultValue,
  placeholder = "Pick a month",
  fromYear,
  toYear,
}: {
  name: string
  defaultValue?: string // "YYYY-MM"
  placeholder?: string
  fromYear?: number
  toYear?: number
}) {
  const now = new Date()
  const initial = defaultValue
    ? { year: Number(defaultValue.split("-")[0]), month: Number(defaultValue.split("-")[1]) }
    : { year: now.getFullYear(), month: now.getMonth() + 1 }

  const [selected, setSelected] = useState<{ year: number; month: number } | null>(
    defaultValue ? initial : null
  )
  const [viewYear, setViewYear] = useState(initial.year)
  const [open, setOpen] = useState(false)

  const currentYear = now.getFullYear()
  const start = fromYear ?? 2015
  const end = toYear ?? currentYear + 2
  const years = Array.from({ length: end - start + 1 }, (_, i) => end - i)

  const value = selected
    ? `${selected.year}-${String(selected.month).padStart(2, "0")}`
    : ""

  const displayLabel = selected
    ? `${MONTH_SHORT[selected.month - 1]} ${selected.year}`
    : null

  return (
    <>
      <input type="hidden" name={name} value={value} />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !selected && "text-muted-foreground"
              )}
            />
          }
        >
          <CalendarIcon className="mr-2 size-4" />
          {displayLabel || placeholder}
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3" align="start">
          <div className="flex items-center justify-between gap-1 pb-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewYear((y) => y - 1)}
              aria-label="Previous year"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Select
              value={String(viewYear)}
              onValueChange={(v) => v && setViewYear(Number(v))}
            >
              <SelectTrigger className="h-8 flex-1 font-semibold">
                <SelectValue>{viewYear}</SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewYear((y) => y + 1)}
              aria-label="Next year"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {MONTH_SHORT.map((m, i) => {
              const isSelected =
                selected?.year === viewYear && selected?.month === i + 1
              return (
                <Button
                  key={m}
                  variant={isSelected ? "default" : "ghost"}
                  size="sm"
                  className="h-8"
                  onClick={() => {
                    setSelected({ year: viewYear, month: i + 1 })
                    setOpen(false)
                  }}
                >
                  {m}
                </Button>
              )
            })}
          </div>
        </PopoverContent>
      </Popover>
    </>
  )
}
