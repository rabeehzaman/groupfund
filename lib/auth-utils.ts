import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export async function requireAuth() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  return session
}

export async function requireAdmin() {
  const session = await requireAuth()
  if (session.user.role !== "ADMIN") {
    throw new Error("Unauthorized: Admin access required")
  }
  return session
}

export async function getCurrentUser() {
  const session = await auth()
  return session?.user ?? null
}
