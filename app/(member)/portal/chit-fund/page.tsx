import { Coins, IndianRupee } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getMyChitFundContributions } from "@/lib/actions/chit-fund"
import { formatCurrency, formatDate } from "@/lib/format"

export default async function MyChitFundPage() {
  const { fund, total, contributions } = await getMyChitFundContributions()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
          My Chit Fund
        </h1>
        <p className="text-muted-foreground mt-1">
          {fund
            ? `Your contributions to ${fund.name}.`
            : "Chit fund tracking is not yet set up."}
        </p>
      </div>

      {!fund ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <Coins className="size-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">
              The admin has not configured a chit fund yet.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Contributed
              </CardTitle>
              <div className="flex size-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950">
                <IndianRupee className="size-4 text-amber-600" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-amber-600">
                {formatCurrency(total)}
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                {contributions.length} contribution
                {contributions.length !== 1 ? "s" : ""}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contribution History</CardTitle>
            </CardHeader>
            <CardContent>
              {contributions.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center text-sm">
                  No chit fund contributions recorded yet.
                </p>
              ) : (
                <div className="divide-y">
                  {contributions.map((c: any) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          {formatDate(c.date)}
                        </p>
                        {c.narration && (
                          <p className="text-muted-foreground text-xs">
                            {c.narration}
                          </p>
                        )}
                      </div>
                      <p className="shrink-0 font-semibold text-amber-600 tabular-nums">
                        {formatCurrency(c.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
