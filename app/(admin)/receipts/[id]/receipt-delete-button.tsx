"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { DeleteDialog } from "@/components/delete-dialog"
import { deleteReceipt } from "@/lib/actions/receipts"

export function ReceiptDeleteButton({ receiptId }: { receiptId: string }) {
  const router = useRouter()

  const handleDelete = async () => {
    try {
      await deleteReceipt(receiptId)
      toast.success("Receipt deleted")
      router.push("/receipts")
    } catch {
      toast.error("Failed to delete receipt")
    }
  }

  return (
    <DeleteDialog
      onConfirm={handleDelete}
      title="Delete this receipt?"
      description="This action cannot be undone. The receipt will be permanently removed."
    />
  )
}
