"use server"

import { signIn, signOut } from "@/lib/auth"
import { loginSchema } from "@/lib/validations/auth"
import { AuthError } from "next-auth"

export async function loginAction(
  _prevState: { error?: string } | null,
  formData: FormData
) {
  const raw = Object.fromEntries(formData)
  const parsed = loginSchema.safeParse(raw)

  if (!parsed.success) {
    return { error: "Invalid email or password." }
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: "/",
    })
    return null
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password." }
    }
    throw error
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" })
}
