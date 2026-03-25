import { getMyProfile } from "@/lib/actions/portal"
import { MemberProfileForm } from "@/components/member-profile-form"

export default async function ProfilePage() {
  const member = await getMyProfile()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
          My Profile
        </h1>
        <p className="text-muted-foreground mt-1">
          Update your personal information.
        </p>
      </div>

      <div className="max-w-2xl">
        <MemberProfileForm member={member} />
      </div>
    </div>
  )
}
