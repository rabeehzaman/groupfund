"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export function ReminderMessage({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success("Message copied to clipboard!")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">WhatsApp Message</p>
        <Button variant="outline" size="sm" onClick={handleCopy}>
          {copied ? (
            <Check className="mr-2 size-4" />
          ) : (
            <Copy className="mr-2 size-4" />
          )}
          {copied ? "Copied!" : "Copy"}
        </Button>
      </div>
      <pre className="whitespace-pre-wrap rounded-md border bg-muted p-4 text-sm">
        {text}
      </pre>
    </div>
  )
}
