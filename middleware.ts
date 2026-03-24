import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { decode } from "@auth/core/jwt"

const SECRET = process.env.AUTH_SECRET!

function getSessionToken(req: NextRequest) {
  return (
    req.cookies.get("__Secure-authjs.session-token")?.value ||
    req.cookies.get("authjs.session-token")?.value
  )
}

async function getPayload(req: NextRequest) {
  const token = getSessionToken(req)
  if (!token) return null
  const cookieName = req.cookies.has("__Secure-authjs.session-token")
    ? "__Secure-authjs.session-token"
    : "authjs.session-token"
  try {
    return await decode({ token, secret: SECRET, salt: cookieName })
  } catch {
    return null
  }
}

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Public paths
  if (pathname.startsWith("/login") || pathname.startsWith("/api/auth")) {
    const payload = await getPayload(req)
    if (payload) {
      return NextResponse.redirect(new URL("/", req.url))
    }
    return NextResponse.next()
  }

  const payload = await getPayload(req)
  const isLoggedIn = !!payload

  // All other routes require auth
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  // Role-based routing
  const role = payload?.role as string | undefined

  // Admin routes — only admins
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/members") ||
    pathname.startsWith("/funds") ||
    pathname.startsWith("/receipts") ||
    pathname.startsWith("/payments") ||
    pathname.startsWith("/reports") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/reminders") ||
    pathname.startsWith("/defaulters")
  ) {
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL("/portal", req.url))
    }
  }

  // Member portal — members and admins
  if (pathname.startsWith("/portal")) {
    if (role !== "MEMBER" && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/login", req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads|icon-|apple-touch-icon|manifest).*)"],
}
