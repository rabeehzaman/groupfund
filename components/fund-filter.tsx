"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useTransition } from "react"
import { Layers } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type Fund = {
  id: string
  name: string
  type: "FIXED" | "OPEN"
}

export function FundFilter({ funds }: { funds: Fund[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const currentFundId = searchParams.get("fundId") ?? "all"

  const handleChange = (value: string | null) => {
    if (!value) return
    const params = new URLSearchParams(searchParams.toString())
    if (value === "all") {
      params.delete("fundId")
    } else {
      params.set("fundId", value)
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  return (
    <Select value={currentFundId} onValueChange={handleChange}>
      <SelectTrigger
        className={`w-auto min-w-[160px] ${isPending ? "opacity-70" : ""}`}
      >
        <Layers className="mr-2 size-4" />
        <SelectValue placeholder="All Funds">
          {currentFundId === "all"
            ? "All Funds"
            : (() => {
                const fund = funds.find((f) => f.id === currentFundId)
                return fund
                  ? `${fund.name} (${fund.type === "FIXED" ? "Fixed" : "Open"})`
                  : "All Funds"
              })()}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Funds</SelectItem>
        {funds.map((f) => (
          <SelectItem key={f.id} value={f.id}>
            {f.name} ({f.type === "FIXED" ? "Fixed" : "Open"})
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
