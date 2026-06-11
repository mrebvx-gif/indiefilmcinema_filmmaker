import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <div className="container mx-auto max-w-7xl py-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <Skeleton className="h-10 w-64 mb-2 bg-muted/50" />
          <Skeleton className="h-5 w-96 bg-muted/50" />
        </div>
        <Skeleton className="h-12 w-48 bg-muted/50" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col gap-4">
            <Skeleton className="w-full aspect-video rounded-xl bg-muted/50" />
            <Skeleton className="h-6 w-3/4 bg-muted/50" />
            <Skeleton className="h-4 w-1/2 bg-muted/50" />
          </div>
        ))}
      </div>
    </div>
  )
}
