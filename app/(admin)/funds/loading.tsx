import { Skeleton } from "@/components/ui/skeleton"

export default function FundsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-4 w-44" />
        </div>
        <Skeleton className="h-9 w-32" />
      </div>

      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="rounded-md border">
          <div className="border-b p-4">
            <div className="flex gap-8">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-24" />
              ))}
            </div>
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-8 border-b p-4 last:border-0">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
