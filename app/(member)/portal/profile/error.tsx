"use client"

import { Button } from "@/components/ui/button"

export default function ProfileError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-12">
      <h2 className="text-lg font-semibold">Something went wrong</h2>
      <p className="text-muted-foreground text-sm">
        Could not load your profile. Please try again.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  )
}
