import Link from "next/link"
import { Suspense } from "react"
import { Plus, Receipt, CreditCard, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SectionCards } from "@/components/section-cards"
import { CollectionTrend } from "@/components/charts/collection-trend"
import { DateFilter } from "@/components/date-filter"
import {
  getDashboardStats,
  getCollectionTrend,
  getRecentActivity,
} from "@/lib/actions/dashboard"
import { formatCurrency, formatDate } from "@/lib/format"

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>
}) {
  const { from, to } = await searchParams
  const [stats, trend, activity] = await Promise.all([
    getDashboardStats(from, to),
    getCollectionTrend(from, to),
    getRecentActivity(from, to),
  ])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview of your group fund.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" render={<Link href="/receipts/new" />}>
              <Receipt className="mr-2 size-4" />
              Add Receipt
          </Button>
          <Button variant="outline" size="sm" render={<Link href="/payments/new" />}>
              <CreditCard className="mr-2 size-4" />
              Add Payment
          </Button>
          <Button size="sm" render={<Link href="/members/new" />}>
              <Plus className="mr-2 size-4" />
              Add Member
          </Button>
        </div>
      </div>

      <Suspense>
        <DateFilter />
      </Suspense>

      <SectionCards stats={stats} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CollectionTrend data={trend} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activity.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center text-sm">
                No activity yet. Add a receipt or payment to get started.
              </p>
            ) : (
              <div className="divide-y">
                {activity.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
                        item.type === "receipt"
                          ? "bg-emerald-100 dark:bg-emerald-950"
                          : "bg-red-100 dark:bg-red-950"
                      }`}>
                        {item.type === "receipt" ? (
                          <ArrowUpRight className="size-4 text-emerald-600" />
                        ) : (
                          <ArrowDownRight className="size-4 text-red-600" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {item.description}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {formatDate(item.date)}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 text-sm font-semibold tabular-nums ${
                        item.amount >= 0
                          ? "text-emerald-600"
                          : "text-red-600"
                      }`}
                    >
                      {item.amount >= 0 ? "+" : ""}
                      {formatCurrency(Math.abs(item.amount))}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
