import Link from "next/link"
import { notFound } from "next/navigation"
import { Pencil, IndianRupee, Users, Receipt, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getFundDashboard } from "@/lib/actions/fund-dashboard"
import { formatCurrency, formatDate } from "@/lib/format"

export default async function FundDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const data = await getFundDashboard(id)

  if (!data) notFound()

  const { fund } = data

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              {fund.name}
            </h1>
            <Badge variant={fund.type === "FIXED" ? "default" : "secondary"}>
              {fund.type === "FIXED" ? "Fixed" : "Open"}
            </Badge>
            {fund.isRecurring && (
              <Badge variant="outline">Recurring</Badge>
            )}
          </div>
          {(fund.description || fund.purpose) && (
            <p className="text-muted-foreground mt-1">
              {fund.description || fund.purpose}
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          render={<Link href={`/funds/${id}/edit`} />}
        >
          <Pencil className="mr-2 size-4" />
          Edit
        </Button>
      </div>

      {/* Progress Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="size-5" />
            Collection Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold text-emerald-600">
                  {formatCurrency(data.collected)}
                </p>
                <p className="text-muted-foreground text-sm">
                  {data.type === "FIXED"
                    ? `of ${formatCurrency(data.expected)} expected`
                    : data.goal > 0
                      ? `of ${formatCurrency(data.goal)} goal`
                      : "collected so far"}
                </p>
              </div>
              {(data.type === "FIXED" || data.goal > 0) && (
                <p className="text-2xl font-bold">
                  {Math.round(data.progress)}%
                </p>
              )}
            </div>
            {(data.type === "FIXED" || data.goal > 0) && (
              <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-emerald-600 transition-all"
                  style={{ width: `${data.progress}%` }}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <Card className="transition-card hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950">
              <IndianRupee className="size-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">
              {formatCurrency(data.collected)}
            </p>
          </CardContent>
        </Card>

        <Card className="transition-card hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contributors</CardTitle>
            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950">
              <Users className="size-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.uniqueContributors}</p>
          </CardContent>
        </Card>

        <Card className="transition-card hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Receipts</CardTitle>
            <div className="flex size-8 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-950">
              <Receipt className="size-4 text-violet-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.receiptCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Receipts */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Receipts</CardTitle>
        </CardHeader>
        <CardContent>
          {data.recentReceipts.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              No receipts yet.
            </p>
          ) : (
            <div className="divide-y">
              {data.recentReceipts.map((receipt: any) => (
                <div
                  key={receipt.id}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium">{receipt.member.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {receipt.member.branch || "No branch"} &middot;{" "}
                      {formatDate(receipt.date)}
                    </p>
                  </div>
                  <p className="font-semibold text-emerald-600 tabular-nums">
                    {formatCurrency(receipt.amount)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
