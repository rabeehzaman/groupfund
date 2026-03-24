import { IndianRupee, CalendarCheck, Activity } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getMyDashboard } from "@/lib/actions/portal"
import { getActiveFunds } from "@/lib/actions/funds"
import { formatCurrency, formatMonthYear, formatDate } from "@/lib/format"
import { PaymentGrid } from "@/components/payment-grid"

export default async function MemberPortalPage() {
  const [{ member, totalPaid, monthsPaid }, funds] = await Promise.all([
    getMyDashboard(),
    getActiveFunds(),
  ])

  // Group receipts by fund
  const receiptsByFund = new Map<
    string,
    {
      fund: { id: string; name: string; type: "FIXED" | "OPEN"; amount: number | null }
      receipts: typeof member.receipts
    }
  >()
  for (const receipt of member.receipts) {
    const fundId = receipt.fund.id
    if (!receiptsByFund.has(fundId)) {
      receiptsByFund.set(fundId, { fund: receipt.fund, receipts: [] })
    }
    receiptsByFund.get(fundId)!.receipts.push(receipt)
  }

  for (const fund of funds) {
    if (!receiptsByFund.has(fund.id)) {
      receiptsByFund.set(fund.id, {
        fund: { id: fund.id, name: fund.name, type: fund.type, amount: fund.amount },
        receipts: [],
      })
    }
  }

  const fundEntries = Array.from(receiptsByFund.values())
  const defaultFund =
    fundEntries.find((e) => funds.find((f) => f.id === e.fund.id && f.isDefault)) ??
    fundEntries[0]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
          Welcome, {member.name}
        </h1>
        <p className="text-muted-foreground mt-1">
          Your payment summary and history.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <Card className="transition-card hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950">
              <IndianRupee className="size-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">
              {formatCurrency(totalPaid)}
            </p>
          </CardContent>
        </Card>

        <Card className="transition-card hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Months Paid</CardTitle>
            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950">
              <CalendarCheck className="size-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{monthsPaid}</p>
          </CardContent>
        </Card>

        <Card className="transition-card hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <div className={`flex size-8 items-center justify-center rounded-lg ${
              member.isActive ? "bg-emerald-100 dark:bg-emerald-950" : "bg-muted"
            }`}>
              <Activity className={`size-4 ${
                member.isActive ? "text-emerald-600" : "text-muted-foreground"
              }`} />
            </div>
          </CardHeader>
          <CardContent>
            <Badge variant={member.isActive ? "default" : "secondary"}>
              {member.isActive ? "Active" : "Inactive"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {fundEntries.length > 0 && (
        <Tabs defaultValue={defaultFund?.fund.id ?? "history"}>
          <TabsList>
            {fundEntries.map((entry) => (
              <TabsTrigger key={entry.fund.id} value={entry.fund.id}>
                {entry.fund.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {fundEntries.map((entry) => (
            <TabsContent key={entry.fund.id} value={entry.fund.id} className="space-y-6">
              <PaymentGrid
                receipts={entry.receipts.map((r) => ({
                  forMonth: r.forMonth,
                  amount: r.amount,
                }))}
                monthlyAmount={
                  entry.fund.type === "FIXED" && entry.fund.amount
                    ? entry.fund.amount
                    : member.monthlyAmount
                }
                joinDate={member.joinDate}
                fundType={entry.fund.type}
                title={`${entry.fund.name} Grid`}
              />

              <Card>
                <CardHeader>
                  <CardTitle>Recent Payments</CardTitle>
                </CardHeader>
                <CardContent>
                  {entry.receipts.length === 0 ? (
                    <p className="text-muted-foreground py-8 text-center text-sm">
                      No payments recorded yet.
                    </p>
                  ) : (
                    <div className="divide-y">
                      {entry.receipts.slice(0, 10).map((receipt) => (
                        <div
                          key={receipt.id}
                          className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                        >
                          <div>
                            <p className="font-medium">
                              {formatMonthYear(receipt.forMonth)}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {receipt.narration || "No narration"} &middot;{" "}
                              {formatDate(receipt.date)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {receipt.proofUrl && (
                              <Badge variant="outline" className="text-xs">
                                Proof
                              </Badge>
                            )}
                            <p className="font-semibold text-emerald-600 tabular-nums">
                              {formatCurrency(receipt.amount)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  )
}
