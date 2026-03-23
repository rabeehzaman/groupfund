import { notFound } from "next/navigation"
import { getMember } from "@/lib/actions/members"
import { MemberForm } from "@/components/member-form"

export default async function EditMemberPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const member = await getMember(id)

  if (!member) notFound()

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Edit Member</h1>
      <MemberForm member={member} />
    </div>
  )
}
