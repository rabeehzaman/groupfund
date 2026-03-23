import { Users, TrendingUp, TrendingDown, Wallet } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/format"

type Stats = {
  totalMembers: number
  totalCollected: number
  totalExpenses: number
  netBalance: number
}

export function SectionCards({ stats }: { stats: Stats }) {
  const cards = [
    {
      title: "Total Collected",
      value: formatCurrency(stats.totalCollected),
      icon: TrendingUp,
      color: "text-emerald-600",
      bg: "bg-emerald-100 dark:bg-emerald-950",
    },
    {
      title: "Total Expenses",
      value: formatCurrency(stats.totalExpenses),
      icon: TrendingDown,
      color: "text-red-600",
      bg: "bg-red-100 dark:bg-red-950",
    },
    {
      title: "Net Balance",
      value: formatCurrency(stats.netBalance),
      icon: Wallet,
      color: stats.netBalance >= 0 ? "text-emerald-600" : "text-red-600",
      bg: stats.netBalance >= 0 ? "bg-emerald-100 dark:bg-emerald-950" : "bg-red-100 dark:bg-red-950",
    },
    {
      title: "Active Members",
      value: String(stats.totalMembers),
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-100 dark:bg-blue-950",
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title} className="transition-card hover:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <div className={`flex size-8 items-center justify-center rounded-lg ${card.bg}`}>
              <card.icon className={`size-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
