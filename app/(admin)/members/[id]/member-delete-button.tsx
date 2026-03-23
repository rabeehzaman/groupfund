"use client"

import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { DeleteDialog } from "@/components/delete-dialog"
import { deleteMember } from "@/lib/actions/members"

export function MemberDeleteButton({
  memberId,
  hasReceipts,
}: {
  memberId: string
  hasReceipts: boolean
}) {
  const router = useRouter()

  const handleDelete = async () => {
    const result = await deleteMember(memberId)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Member deleted")
      router.push("/members")
    }
  }

  return (
    <DeleteDialog
      onConfirm={handleDelete}
      title="Delete this member?"
      description={
        hasReceipts
          ? "This member has payment records and cannot be deleted. Deactivate them instead."
          : "This action cannot be undone. The member will be permanently removed."
      }
    />
  )
}
