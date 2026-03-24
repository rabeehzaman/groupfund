"use client"

import { useState } from "react"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"

export function ExportButtons({
  endpoint,
  searchParams,
  label = "Export",
}: {
  endpoint: string
  searchParams?: string
  label?: string
}) {
  const [loading, setLoading] = useState(false)

  const download = async (format: string) => {
    setLoading(true)
    try {
      const params = new URLSearchParams(searchParams || "")
      params.set("format", format)
      const url = `${endpoint}?${params.toString()}`
      const res = await fetch(url)

      if (!res.ok) {
        toast.error("Export failed")
        return
      }

      const blob = await res.blob()
      const a = document.createElement("a")
      a.href = URL.createObjectURL(blob)

      const ext = format === "xlsx" ? "xlsx" : format === "pdf" ? "pdf" : "csv"
      a.download = `export-${Date.now()}.${ext}`
      a.click()
      URL.revokeObjectURL(a.href)
      toast.success(`${format.toUpperCase()} exported successfully`)
    } catch {
      toast.error("Export failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" size="sm" disabled={loading} />}>
        <Download className="mr-2 size-4" />
        {loading ? "Exporting..." : label}
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onSelect={() => download("xlsx")}>
          Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => download("csv")}>
          CSV (.csv)
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => download("pdf")}>
          PDF (.pdf)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
