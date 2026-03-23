"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { DeleteDialog } from "@/components/delete-dialog"
import { deleteFund } from "@/lib/actions/funds"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

export function FundDeleteButton({
  fundId,
  hasReceipts,
}: {
  fundId: string
  hasReceipts: boolean
}) {
  const router = useRouter()

  if (hasReceipts) {
    return (
      <Button variant="destructive" size="sm" disabled>
        <Trash2 className="mr-2 size-4" />
        Delete
      </Button>
    )
  }

  return (
    <DeleteDialog
      title="Delete this fund?"
      description="This action cannot be undone. The fund will be permanently removed."
      onConfirm={async () => {
        const result = await deleteFund(fundId)
        if (result.error) {
          toast.error(result.error)
        } else {
          toast.success("Fund deleted")
          router.push("/funds")
        }
      }}
    />
  )
}
