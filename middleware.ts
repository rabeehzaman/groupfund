import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

function getSessionToken(req: NextRequest) {
  return (
    req.cookies.get("__Secure-authjs.session-token")?.value ||
    req.cookies.get("authjs.session-token")?.value
  )
}

function parseJwtPayload(token: string) {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) return null
    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf-8")
    )
    return payload
  } catch {
    return null
  }
}

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const token = getSessionToken(req)
  const payload = token ? parseJwtPayload(token) : null
  const isLoggedIn = !!payload

  // Public paths
  if (pathname.startsWith("/login") || pathname.startsWith("/api/auth")) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/", req.url))
    }
    return NextResponse.next()
  }

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
