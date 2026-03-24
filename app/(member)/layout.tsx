import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { MemberNav } from "@/components/member-nav"

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect("/login")

  return (
    <div className="min-h-screen bg-background">
      <MemberNav user={session.user} />
      <main className="mx-auto max-w-4xl p-4 md:p-6">{children}</main>
    </div>
  )
}
