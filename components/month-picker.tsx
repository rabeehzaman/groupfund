"use client"

import { useState } from "react"
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { MONTH_SHORT } from "@/lib/constants"

export function MonthPicker({
  name,
  defaultValue,
  placeholder = "Pick a month",
}: {
  name: string
  defaultValue?: string // "YYYY-MM"
  placeholder?: string
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
