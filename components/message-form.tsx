"use client"

import { useActionState, useEffect, useRef } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Send } from "lucide-react"
import { createMyMessage } from "@/lib/actions/messages"

type State = { success?: true; error?: { content?: string[] } } | null

export function MessageForm() {
  const [state, formAction, isPending] = useActionState<State, FormData>(
    createMyMessage as any,
    null
  )
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.success) {
      toast.success("Message sent to admin")
      formRef.current?.reset()
    }
  }, [state])

  const contentError = state?.error?.content?.[0]

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="content">Your message</Label>
        <Textarea
          id="content"
          name="content"
          placeholder="Type your note, question, or payment doubt for the admin…"
          rows={5}
          maxLength={2000}
          required
        />
        {contentError && (
          <p className="text-sm text-red-600">{contentError}</p>
        )}
      </div>
      <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
        <Send className="size-4" />
        {isPending ? "Sending..." : "Send Message"}
      </Button>
    </form>
  )
}
