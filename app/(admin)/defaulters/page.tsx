import Link from "next/link"
import { AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getDefaulters } from "@/lib/actions/defaulters"
import { formatCurrency } from "@/lib/format"
import { DefaulterBadge } from "@/components/defaulter-badge"

export default async function DefaultersPage() {
  const defaulters = await getDefaulters()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
          Defaulters
        </h1>
        <p className="text-muted-foreground mt-1">
          Members with pending payments.
        </p>
      </div>

      {defaulters.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12">
            <div className="flex size-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
              <AlertTriangle className="size-6 text-emerald-600" />
            </div>
            <p className="text-muted-foreground text-sm">
              No defaulters! All members are up to date.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-orange-500" />
              {defaulters.length} member{defaulters.length !== 1 ? "s" : ""}{" "}
              with pending payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Expected</TableHead>
                    <TableHead className="text-right">
                      Pending
                    </TableHead>
                    <TableHead className="text-center">Severity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {defaulters.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell>
                        <Link
                          href={`/members/${d.id}`}
                          className="font-medium hover:underline"
                        >
                          {d.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {d.branch || "-"}
                      </TableCell>
                      <TableCell className="text-right text-emerald-600 font-medium tabular-nums">
                        {formatCurrency(d.totalPaid)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground tabular-nums">
                        {formatCurrency(d.expectedTotal)}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-red-500 tabular-nums">
                        {formatCurrency(d.pendingAmount)}
                      </TableCell>
                      <TableCell className="text-center">
                        <DefaulterBadge
                          pendingAmount={d.pendingAmount}
                          severity={d.severity}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
