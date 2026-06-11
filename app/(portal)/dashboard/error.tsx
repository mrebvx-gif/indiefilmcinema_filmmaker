"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="container mx-auto max-w-7xl py-24 flex flex-col items-center justify-center text-center animate-in fade-in duration-500">
      <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
        <AlertCircle className="w-8 h-8 text-destructive" />
      </div>
      <h2 className="text-3xl font-bold tracking-tight mb-3">Something went wrong!</h2>
      <p className="text-muted-foreground max-w-md mb-8">
        We encountered an unexpected error while loading your dashboard. Please try again.
      </p>
      <Button onClick={() => reset()} className="bg-primary text-primary-foreground font-bold h-12 px-8 hover:bg-primary/90 transition-colors">
        Try again
      </Button>
    </div>
  )
}
