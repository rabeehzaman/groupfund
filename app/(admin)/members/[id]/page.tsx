import Link from "next/link"
import { notFound } from "next/navigation"
import { Pencil, IndianRupee, CalendarCheck, Banknote, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getMemberWithStats } from "@/lib/actions/members"
import { getActiveFunds } from "@/lib/actions/funds"
import { formatCurrency, formatMonthYear, formatDate } from "@/lib/format"
import { PaymentGrid } from "@/components/payment-grid"
import { MemberDeleteButton } from "./member-delete-button"

export default async function MemberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [member, funds] = await Promise.all([
    getMemberWithStats(id),
    getActiveFunds(),
  ])

  if (!member) notFound()

  // Group receipts by fund
  const receiptsByFund = new Map<
    string,
    { fund: { id: string; name: string; type: "FIXED" | "OPEN"; amount: number | null }; receipts: typeof member.receipts }
  >()
  for (const receipt of member.receipts) {
    const fundId = receipt.fund.id
    if (!receiptsByFund.has(fundId)) {
      receiptsByFund.set(fundId, { fund: receipt.fund, receipts: [] })
    }
    receiptsByFund.get(fundId)!.receipts.push(receipt)
  }

  // Ensure all active funds appear even with 0 receipts
  for (const fund of funds) {
    if (!receiptsByFund.has(fund.id)) {
      receiptsByFund.set(fund.id, {
        fund: { id: fund.id, name: fund.name, type: fund.type, amount: fund.amount },
        receipts: [],
      })
    }
  }

  const fundEntries = Array.from(receiptsByFund.values())
  const defaultFund = fundEntries.find((e) =>
    funds.find((f) => f.id === e.fund.id && f.isDefault)
  ) ?? fundEntries[0]

  const statCards = [
    {
      title: "Total Paid",
      value: formatCurrency(member.totalPaid),
      icon: IndianRupee,
      color: "text-emerald-600",
      bg: "bg-emerald-100 dark:bg-emerald-950",
    },
    {
      title: "Months Paid",
      value: String(member.monthsPaid),
      icon: CalendarCheck,
      color: "text-blue-600",
      bg: "bg-blue-100 dark:bg-blue-950",
    },
    {
      title: "Monthly Amount",
      value: formatCurrency(member.monthlyAmount),
      icon: Banknote,
      color: "text-violet-600",
      bg: "bg-violet-100 dark:bg-violet-950",
    },
    {
      title: "Status",
      value: null,
      icon: Activity,
      color: member.isActive ? "text-emerald-600" : "text-muted-foreground",
      bg: member.isActive ? "bg-emerald-100 dark:bg-emerald-950" : "bg-muted",
      badge: true,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{member.name}</h1>
            <Badge variant={member.isActive ? "default" : "secondary"}>
              {member.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            {member.branch || "No branch"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" render={<Link href={`/members/${id}/edit`} />}>
              <Pencil className="mr-2 size-4" />
              Edit
          </Button>
          <MemberDeleteButton
            memberId={id}
            hasReceipts={member.receipts.length > 0}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.title} className="transition-card hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                {card.title}
              </CardTitle>
              <div className={`flex size-8 items-center justify-center rounded-lg ${card.bg}`}>
                <card.icon className={`size-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              {card.badge ? (
                <Badge variant={member.isActive ? "default" : "secondary"} className="mt-1">
                  {member.isActive ? "Active" : "Inactive"}
                </Badge>
              ) : (
                <p className="text-2xl font-bold">{card.value}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

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
                <CardTitle>Payment History</CardTitle>
              </CardHeader>
              <CardContent>
                {entry.receipts.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-8">
                    <p className="text-muted-foreground text-sm">
                      No payments recorded yet.
                    </p>
                    <Button variant="outline" size="sm" render={<Link href="/receipts/new" />}>
                      Record a Payment
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y">
                    {entry.receipts
                      .slice()
                      .reverse()
                      .map((receipt) => (
                        <div
                          key={receipt.id}
                          className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                        >
                          <div>
                            <p className="font-medium">
                              {formatMonthYear(receipt.forMonth)}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {receipt.narration || "No narration"}{" "}
                              &middot; {formatDate(receipt.date)}
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
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
