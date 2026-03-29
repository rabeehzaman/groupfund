import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function DefaultersLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-4 w-48" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-56" />
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="border-b px-4 py-3 flex gap-8">
              {["w-20", "w-16", "w-16", "w-20", "w-20", "w-16"].map((w, i) => (
                <Skeleton key={i} className={`h-4 ${w}`} />
              ))}
            </div>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="border-b last:border-0 px-4 py-3 flex gap-8">
                {["w-28", "w-20", "w-16", "w-20", "w-20", "w-14"].map((w, j) => (
                  <Skeleton key={j} className={`h-4 ${w}`} />
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
