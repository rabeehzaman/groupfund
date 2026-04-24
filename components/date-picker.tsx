"use client"

import { useState } from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export function DatePicker({
  name,
  defaultValue,
  placeholder = "Pick a date",
  fromYear,
  toYear,
}: {
  name: string
  defaultValue?: Date
  placeholder?: string
  fromYear?: number
  toYear?: number
}) {
  const [date, setDate] = useState<Date | undefined>(defaultValue)
  const [open, setOpen] = useState(false)

  const currentYear = new Date().getFullYear()
  const start = fromYear ?? 1940
  const end = toYear ?? currentYear + 5

  // Emit YYYY-MM-DD in local time so server and DB never shift the day
  // across timezones (e.g. IST users losing a day on toISOString()).
  const value = date
    ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
    : ""

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
                !date && "text-muted-foreground"
              )}
            />
          }
        >
          <CalendarIcon className="mr-2 size-4" />
          {date ? format(date, "PPP") : placeholder}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => {
              setDate(d)
              setOpen(false)
            }}
            defaultMonth={date ?? new Date()}
            captionLayout="dropdown"
            startMonth={new Date(start, 0)}
            endMonth={new Date(end, 11)}
          />
        </PopoverContent>
      </Popover>
    </>
  )
}
