"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { deleteFund } from "@/lib/actions/funds"
import { Trash2, AlertTriangle } from "lucide-react"

export function FundDeleteButton({
  fundId,
  hasReceipts,
  receiptCount,
}: {
  fundId: string
  hasReceipts: boolean
  receiptCount: number
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)

  async function handleConfirm() {
    setPending(true)
    try {
      const result = await deleteFund(fundId, { force: hasReceipts })
      if ("error" in result && result.error) {
        toast.error(result.error)
        return
      }
      toast.success("Fund deleted")
      setOpen(false)
      router.push("/funds")
      router.refresh()
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to delete fund")
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      <Button variant="destructive" size="sm" onClick={() => setOpen(true)}>
        <Trash2 className="mr-2 size-4" />
        Delete
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-950">
              <AlertTriangle className="size-6 text-red-600" />
            </div>
            <AlertDialogTitle className="text-center">
              Delete this fund?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              {hasReceipts ? (
                <>
                  This will permanently delete the fund{" "}
                  <strong>and its {receiptCount} receipt
                  {receiptCount === 1 ? "" : "s"}</strong>. This cannot be
                  undone.
                </>
              ) : (
                "This action cannot be undone."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center gap-2">
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleConfirm()
              }}
              disabled={pending}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {pending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
