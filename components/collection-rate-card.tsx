import { Target } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type CollectionRateData = {
  paidCount: number
  totalActive: number
  rate: number
}

export function CollectionRateCard({ data }: { data: CollectionRateData }) {
  const color =
    data.rate >= 80
      ? "text-emerald-600"
      : data.rate >= 50
        ? "text-yellow-600"
        : "text-red-600"

  const bgColor =
    data.rate >= 80
      ? "bg-emerald-600"
      : data.rate >= 50
        ? "bg-yellow-600"
        : "bg-red-600"

  return (
    <Card className="transition-card hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Collection Rate
        </CardTitle>
        <div className="flex size-8 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-950">
          <Target className="size-4 text-violet-600" />
        </div>
      </CardHeader>
      <CardContent>
        <p className={`text-3xl font-bold ${color}`}>
          {Math.round(data.rate)}%
        </p>
        <p className="text-muted-foreground mt-1 text-sm">
          {data.paidCount} of {data.totalActive} members fully paid
        </p>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all ${bgColor}`}
            style={{ width: `${Math.min(data.rate, 100)}%` }}
          />
        </div>
      </CardContent>
    </Card>
  )
}
