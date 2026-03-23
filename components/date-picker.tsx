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
}: {
  name: string
  defaultValue?: Date
  placeholder?: string
}) {
  const [date, setDate] = useState<Date | undefined>(defaultValue)
  const [open, setOpen] = useState(false)

  return (
    <>
      <input
        type="hidden"
        name={name}
        value={date ? date.toISOString() : ""}
      />
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
            defaultMonth={date}
          />
        </PopoverContent>
      </Popover>
    </>
  )
}
