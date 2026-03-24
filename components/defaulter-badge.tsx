import { Badge } from "@/components/ui/badge"

const severityClasses = {
  yellow:
    "bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200",
  orange:
    "bg-orange-100 text-orange-800 hover:bg-orange-100 dark:bg-orange-900 dark:text-orange-200",
  red: "bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900 dark:text-red-200",
}

export function DefaulterBadge({
  months,
  severity,
}: {
  months: number
  severity: "yellow" | "orange" | "red"
}) {
  return (
    <Badge className={severityClasses[severity]}>
      {months}m overdue
    </Badge>
  )
}
