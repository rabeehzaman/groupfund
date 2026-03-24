import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth

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
  const role = req.auth?.user?.role

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
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads).*)"],
}
