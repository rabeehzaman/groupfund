"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Receipt, Upload, LogOut, Wallet } from "lucide-react"
import { cn } from "@/lib/utils"
import { logoutAction } from "@/lib/actions/auth"

const navItems = [
  { title: "Dashboard", href: "/portal", icon: LayoutDashboard },
  { title: "My Payments", href: "/portal/payments", icon: Receipt },
  { title: "Upload Proof", href: "/portal/upload", icon: Upload },
]

type User = {
  name: string
  email: string
}

export function MemberNav({ user }: { user: User }) {
  const pathname = usePathname()

  return (
    <header className="border-b bg-background">
      <div className="flex h-14 items-center gap-4 px-4 md:px-6">
        <Link href="/portal" className="flex items-center gap-2 font-semibold">
          <div className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Wallet className="size-4" />
          </div>
          <span className="hidden sm:inline">Group Fund</span>
        </Link>

        <nav className="flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                pathname === item.href
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground"
              )}
            >
              <item.icon className="size-4" />
              <span className="hidden sm:inline">{item.title}</span>
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <span className="text-muted-foreground hidden text-sm md:inline">
            {user.name}
          </span>
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </form>
        </div>
      </div>
    </header>
  )
}
