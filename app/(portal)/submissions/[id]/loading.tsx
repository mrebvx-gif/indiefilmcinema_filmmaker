import { Skeleton } from "@/components/ui/skeleton"

export default function SubmissionLoading() {
  return (
    <div className="container mx-auto max-w-5xl py-10 animate-in fade-in duration-500">
      <Skeleton className="h-5 w-32 mb-8 bg-muted/50" />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="w-full aspect-video rounded-xl bg-muted/50" />
          <div>
            <Skeleton className="h-10 w-3/4 mb-4 bg-muted/50" />
            <div className="flex gap-4 mb-6">
              <Skeleton className="h-6 w-24 bg-muted/50" />
              <Skeleton className="h-6 w-24 bg-muted/50" />
              <Skeleton className="h-6 w-32 bg-muted/50" />
            </div>
            <Skeleton className="h-32 w-full bg-muted/50" />
          </div>
        </div>
        
        <div className="space-y-6">
          <Skeleton className="h-48 w-full rounded-xl bg-muted/50" />
          <Skeleton className="h-48 w-full rounded-xl bg-muted/50" />
        </div>
      </div>
    </div>
  )
}
