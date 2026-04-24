import Link from "next/link"
import Image from "next/image"
import { Coins, User, IndianRupee, Users, Receipt } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  getChitFundSummary,
  getChitFundMemberTotals,
  getChitFundRecentContributions,
  getMembersForChitSelect,
} from "@/lib/actions/chit-fund"
import { ChitContributionForm } from "@/components/chit-contribution-form"
import { formatCurrency, formatDate } from "@/lib/format"

export default async function ChitFundPage() {
  const [summary, memberTotals, recent, members] = await Promise.all([
    getChitFundSummary(),
    getChitFundMemberTotals(),
    getChitFundRecentContributions(15),
    getMembersForChitSelect(),
  ])

  if (!summary.fund) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            Chit Fund
          </h1>
          <p className="text-muted-foreground mt-1">
            Track chit fund contributions from members.
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <Coins className="size-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">
              No fund is currently marked as the chit fund.
            </p>
            <p className="text-muted-foreground max-w-md text-xs">
              Create a new fund or edit an existing one and tick
              &quot;This is the Chit Fund&quot; to enable tracking here.
            </p>
            <Button render={<Link href="/funds/new" />} size="sm">
              Create a fund
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const contributors = memberTotals.rows.filter((m: any) => m.total > 0)
  const nonContributors = memberTotals.rows.filter((m: any) => m.total === 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
          Chit Fund
        </h1>
        <p className="text-muted-foreground mt-1">
          {summary.fund.name} — contributions and member-wise totals.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Collected</CardTitle>
            <div className="flex size-8 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-950">
              <IndianRupee className="size-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">
              {formatCurrency(summary.totalCollected)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contributors</CardTitle>
            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950">
              <Users className="size-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.contributorCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950">
              <Receipt className="size-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.receiptCount}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Add Chit Contribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ChitContributionForm members={members} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Member-wise Totals</CardTitle>
          </CardHeader>
          <CardContent>
            {contributors.length === 0 && nonContributors.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center text-sm">
                No members yet.
              </p>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead className="text-right">Entries</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...contributors, ...nonContributors].map((m: any) => (
                      <TableRow key={m.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {m.photoUrl ? (
                              <Image
                                src={m.photoUrl}
                                alt={m.name}
                                width={28}
                                height={28}
                                className="size-7 rounded-full object-cover"
                              />
                            ) : (
                              <div className="flex size-7 items-center justify-center rounded-full bg-muted">
                                <User className="size-3.5 text-muted-foreground" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <Link
                                href={`/members/${m.id}`}
                                className="font-medium hover:underline"
                              >
                                {m.name}
                              </Link>
                              {m.branch && (
                                <p className="text-muted-foreground text-xs">
                                  {m.branch}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground tabular-nums">
                          {m.count}
                        </TableCell>
                        <TableCell className="text-right font-semibold tabular-nums">
                          {m.total > 0 ? (
                            <span className="text-amber-600">
                              {formatCurrency(m.total)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Contributions</CardTitle>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-sm">
              No contributions yet.
            </p>
          ) : (
            <div className="divide-y">
              {recent.map((r: any) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {r.member?.name ?? "Unknown member"}
                      {r.member?.branch && (
                        <span className="text-muted-foreground font-normal">
                          {" "}
                          · {r.member.branch}
                        </span>
                      )}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {formatDate(r.date)}
                      {r.narration && ` · ${r.narration}`}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-amber-600 tabular-nums">
                    {formatCurrency(r.amount)}
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
