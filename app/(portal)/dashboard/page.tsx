export default function DashboardPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="text-center z-10 animate-in slide-in-from-bottom-8 duration-1000">
        <h1 className="text-5xl font-bold tracking-tight text-foreground mb-4">Filmmaker Dashboard</h1>
        <p className="text-xl text-muted-foreground max-w-lg mx-auto">
          Phase 2 will add subscription gate. Phase 5 will build this page.
        </p>
      </div>
    </div>
  )
}
