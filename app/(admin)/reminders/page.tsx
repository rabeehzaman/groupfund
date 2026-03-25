import Link from "next/link"
import { Bell } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getPendingMembers, generateReminderText } from "@/lib/actions/reminders"
import { formatCurrency } from "@/lib/format"
import { ReminderMessage } from "@/components/reminder-message"

export default async function RemindersPage() {
  const data = await getPendingMembers()
  const reminderText = await generateReminderText()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
          Payment Reminders
        </h1>
        <p className="text-muted-foreground mt-1">
          Members with pending payments{data.fundName ? ` for ${data.fundName}` : ""}.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{data.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Fully Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">{data.paid}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              {data.pending.length}
            </p>
          </CardContent>
        </Card>
      </div>

      {data.pending.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12">
            <div className="flex size-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
              <Bell className="size-6 text-emerald-600" />
            </div>
            <p className="text-muted-foreground text-sm">
              All members have fully paid!
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="size-5 text-orange-500" />
                Pending Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Member</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead className="text-right">Pending</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.pending.map((m, i) => (
                      <TableRow key={m.id}>
                        <TableCell className="text-muted-foreground">
                          {i + 1}
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/members/${m.id}`}
                            className="font-medium hover:underline"
                          >
                            {m.name}
                          </Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {m.branch || "-"}
                        </TableCell>
                        <TableCell className="text-right text-emerald-600 tabular-nums">
                          {formatCurrency(m.totalPaid)}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-red-500 tabular-nums">
                          {formatCurrency(m.pendingAmount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Share</CardTitle>
            </CardHeader>
            <CardContent>
              <ReminderMessage text={reminderText} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
