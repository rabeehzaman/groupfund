"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

type Crumb = { label: string; href?: string }

type User = {
  name: string
  role: string
}

function getBreadcrumbs(pathname: string): Crumb[] {
  const map: Record<string, Crumb[]> = {
    "/dashboard": [{ label: "Dashboard" }],
    "/members": [{ label: "Members" }],
    "/members/new": [{ label: "Members", href: "/members" }, { label: "Add Member" }],
    "/receipts": [{ label: "Receipts" }],
    "/receipts/new": [{ label: "Receipts", href: "/receipts" }, { label: "Add Receipt" }],
    "/receipts/batch": [{ label: "Receipts", href: "/receipts" }, { label: "Batch Entry" }],
    "/payments": [{ label: "Payments" }],
    "/payments/new": [{ label: "Payments", href: "/payments" }, { label: "Add Payment" }],
    "/funds": [{ label: "Funds" }],
    "/funds/new": [{ label: "Funds", href: "/funds" }, { label: "Create Fund" }],
    "/reports": [{ label: "Reports" }],
    "/settings": [{ label: "Settings" }],
    "/defaulters": [{ label: "Defaulters" }],
    "/reminders": [{ label: "Reminders" }],
  }

  if (map[pathname]) return map[pathname]
  if (pathname.includes("/members/") && pathname.includes("/edit"))
    return [{ label: "Members", href: "/members" }, { label: "Edit Member" }]
  if (pathname.includes("/members/"))
    return [{ label: "Members", href: "/members" }, { label: "Member Details" }]
  if (pathname.includes("/receipts/") && pathname.includes("/edit"))
    return [{ label: "Receipts", href: "/receipts" }, { label: "Edit Receipt" }]
  if (pathname.includes("/payments/") && pathname.includes("/edit"))
    return [{ label: "Payments", href: "/payments" }, { label: "Edit Payment" }]
  if (pathname.includes("/funds/") && pathname.includes("/edit"))
    return [{ label: "Funds", href: "/funds" }, { label: "Edit Fund" }]
  if (pathname.match(/^\/funds\/[^/]+$/))
    return [{ label: "Funds", href: "/funds" }, { label: "Fund Details" }]
  return [{ label: "Group Fund" }]
}

export function SiteHeader({ user }: { user?: User }) {
  const pathname = usePathname()
  const crumbs = getBreadcrumbs(pathname)
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => setMounted(true), [])

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 overflow-hidden border-b px-4">
      <SidebarTrigger className="-ml-1 shrink-0" />
      <Separator orientation="vertical" className="mr-2 h-4 shrink-0" />
      <Breadcrumb className="min-w-0">
        <BreadcrumbList className="flex-nowrap">
          {crumbs.map((crumb, i) => (
            <React.Fragment key={i}>
              {i > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem className="shrink-0">
                {crumb.href ? (
                  <BreadcrumbLink render={<Link href={crumb.href} />}>
                    {crumb.label}
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage className="truncate">{crumb.label}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      <div className="ml-auto flex shrink-0 items-center gap-2">
        {mounted && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          >
            {resolvedTheme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            <span className="sr-only">Toggle theme</span>
          </Button>
        )}
        {user && (
          <span className="text-muted-foreground hidden text-xs sm:inline">
            {user.name}
          </span>
        )}
      </div>
    </header>
  )
}
