import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getMyPayments } from "@/lib/actions/portal"
import { formatCurrency, formatMonthYear, formatDate } from "@/lib/format"

export default async function MyPaymentsPage() {
  const payments = await getMyPayments()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
          My Payments
        </h1>
        <p className="text-muted-foreground mt-1">
          Complete history of your contributions.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Payment History ({payments.length} receipt
            {payments.length !== 1 ? "s" : ""})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              No payments recorded yet.
            </p>
          ) : (
            <div className="divide-y">
              {payments.map((receipt) => (
                <div
                  key={receipt.id}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium">
                      {receipt.forMonth ? formatMonthYear(receipt.forMonth) : formatDate(receipt.date)}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {receipt.fund.name} &middot; {formatDate(receipt.date)}
                    </p>
                    {receipt.narration && (
                      <p className="text-muted-foreground mt-0.5 text-xs">
                        {receipt.narration}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {receipt.status === "PENDING" && (
                      <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                        Pending
                      </Badge>
                    )}
                    {receipt.status === "VERIFIED" && (
                      <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                        Verified
                      </Badge>
                    )}
                    {receipt.status === "REJECTED" && (
                      <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                        Rejected
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
    </div>
  )
}
