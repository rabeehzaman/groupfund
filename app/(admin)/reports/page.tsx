import { Suspense } from "react"
import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, Wallet } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  getMemberWiseReport,
  getOverallSummary,
  getTransactionTimeline,
} from "@/lib/actions/reports"
import { getActiveFunds } from "@/lib/actions/funds"
import { formatCurrency, formatDate, formatMonthYear } from "@/lib/format"
import { DateFilter } from "@/components/date-filter"
import { FundFilter } from "@/components/fund-filter"
import { ExportButtons } from "@/components/export-buttons"

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; fundId?: string }>
}) {
  const { from, to, fundId } = await searchParams
  const [memberReport, summary, timeline, funds] = await Promise.all([
    getMemberWiseReport(from, to, fundId),
    getOverallSummary(from, to, fundId),
    getTransactionTimeline(from, to, fundId),
    getActiveFunds(),
  ])

  const isOpenFund = memberReport[0]?.isOpenFund ?? false

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Reports</h1>
        <p className="text-muted-foreground mt-1">
          Financial reports and summaries.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Suspense>
          <DateFilter />
        </Suspense>
        <Suspense>
          <FundFilter funds={funds.map((f) => ({ id: f.id, name: f.name, type: f.type }))} />
        </Suspense>
        <ExportButtons
          endpoint="/api/export/report"
          searchParams={`${from ? `from=${from}` : ""}${to ? `&to=${to}` : ""}${fundId ? `&fundId=${fundId}` : ""}`}
          label="Export Report"
        />
      </div>

      <Tabs defaultValue="memberwise">
        <TabsList>
          <TabsTrigger value="memberwise">Member-wise</TabsTrigger>
          <TabsTrigger value="summary">Overall Summary</TabsTrigger>
          <TabsTrigger value="timeline">Transaction Timeline</TabsTrigger>
        </TabsList>

        {/* Member-wise Report */}
        <TabsContent value="memberwise">
          <Card>
            <CardContent className="pt-6">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead className="text-right">Total Paid</TableHead>
                      {!isOpenFund && (
                        <>
                          <TableHead className="text-right">Expected</TableHead>
                          <TableHead className="text-right">Pending</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                        </>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {memberReport.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">
                          {m.name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {m.branch || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(m.totalPaid)}
                        </TableCell>
                        {!isOpenFund && (
                          <>
                            <TableCell className="text-right">
                              {formatCurrency(m.expectedTotal)}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(Math.max(0, m.pendingAmount))}
                            </TableCell>
                            <TableCell className="text-center">
                              {m.pendingMonths <= 0 ? (
                                <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                                  Paid
                                </Badge>
                              ) : m.pendingMonths <= 2 ? (
                                <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                  {m.pendingMonths}m pending
                                </Badge>
                              ) : (
                                <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                  {m.pendingMonths}m overdue
                                </Badge>
                              )}
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {isOpenFund ? (
                <p className="text-muted-foreground mt-4 text-sm">
                  Total collected:{" "}
                  {formatCurrency(
                    memberReport.reduce((sum, m) => sum + m.totalPaid, 0)
                  )}
                </p>
              ) : (
                <p className="text-muted-foreground mt-4 text-sm">
                  Total pending:{" "}
                  {formatCurrency(
                    memberReport.reduce(
                      (sum, m) => sum + Math.max(0, m.pendingAmount),
                      0
                    )
                  )}
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Overall Summary */}
        <TabsContent value="summary">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Cash In
                  </CardTitle>
                  <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950">
                    <TrendingUp className="size-4 text-emerald-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-emerald-600">
                    {formatCurrency(summary.totalCollected)}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {summary.totalReceipts} receipts
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Cash Out
                  </CardTitle>
                  <div className="flex size-8 items-center justify-center rounded-lg bg-red-100 dark:bg-red-950">
                    <TrendingDown className="size-4 text-red-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(summary.totalExpenses)}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {summary.totalPayments} payments
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Net Amount
                  </CardTitle>
                  <div className={`flex size-8 items-center justify-center rounded-lg ${summary.netBalance >= 0 ? "bg-emerald-100 dark:bg-emerald-950" : "bg-red-100 dark:bg-red-950"}`}>
                    <Wallet className={`size-4 ${summary.netBalance >= 0 ? "text-emerald-600" : "text-red-600"}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <p
                    className={`text-2xl font-bold ${
                      summary.netBalance >= 0
                        ? "text-emerald-600"
                        : "text-red-600"
                    }`}
                  >
                    {formatCurrency(summary.netBalance)}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {summary.totalMembers} active members
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Month</TableHead>
                        <TableHead className="text-right">Cash In</TableHead>
                        <TableHead className="text-right">Cash Out</TableHead>
                        <TableHead className="text-right">Net</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {summary.monthlyBreakdown.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="text-muted-foreground py-8 text-center"
                          >
                            No transactions in selected period.
                          </TableCell>
                        </TableRow>
                      ) : (
                        summary.monthlyBreakdown.map((m) => (
                          <TableRow key={m.month}>
                            <TableCell className="font-medium">
                              {formatMonthYear(m.month)}
                            </TableCell>
                            <TableCell className="text-right text-emerald-600">
                              {m.cashIn > 0 ? `+${formatCurrency(m.cashIn)}` : "-"}
                            </TableCell>
                            <TableCell className="text-right text-red-600">
                              {m.cashOut > 0 ? `-${formatCurrency(m.cashOut)}` : "-"}
                            </TableCell>
                            <TableCell
                              className={`text-right font-semibold ${
                                m.net >= 0
                                  ? "text-emerald-600"
                                  : "text-red-600"
                              }`}
                            >
                              {formatCurrency(m.net)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                    {summary.monthlyBreakdown.length > 0 && (
                      <TableFooter>
                        <TableRow className="font-bold">
                          <TableCell>Total</TableCell>
                          <TableCell className="text-right text-emerald-600">
                            +{formatCurrency(summary.totalCollected)}
                          </TableCell>
                          <TableCell className="text-right text-red-600">
                            -{formatCurrency(summary.totalExpenses)}
                          </TableCell>
                          <TableCell
                            className={`text-right ${
                              summary.netBalance >= 0
                                ? "text-emerald-600"
                                : "text-red-600"
                            }`}
                          >
                            {formatCurrency(summary.netBalance)}
                          </TableCell>
                        </TableRow>
                      </TableFooter>
                    )}
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Transaction Timeline */}
        <TabsContent value="timeline">
          <Card>
            <CardContent className="pt-6">
              {timeline.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center">
                  No transactions yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {timeline.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-md border p-3"
                    >
                      <div className="flex items-center gap-3">
                        {item.type === "receipt" ? (
                          <div className="flex size-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900">
                            <ArrowUpRight className="size-4 text-emerald-600" />
                          </div>
                        ) : (
                          <div className="flex size-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
                            <ArrowDownRight className="size-4 text-red-600" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium">
                            {item.description}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {formatDate(item.date)}
                            {item.narration
                              ? ` - ${item.narration}`
                              : ""}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`font-semibold ${
                          item.type === "receipt"
                            ? "text-emerald-600"
                            : "text-red-600"
                        }`}
                      >
                        {item.type === "receipt" ? "+" : "-"}
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
