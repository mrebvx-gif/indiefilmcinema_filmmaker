export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-background">
      {/* Cinematic background effects */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-[30%] -left-[10%] w-[60%] h-[60%] rounded-full bg-brand-light/20 blur-[120px] animate-pulse-slow" />
        <div className="absolute -bottom-[30%] -right-[10%] w-[60%] h-[60%] rounded-full bg-accent/10 blur-[120px]" />
        <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] rounded-full bg-primary/10 blur-[100px]" />
      </div>
      <div className="z-10 w-full max-w-md px-4 py-12">
        {children}
      </div>
    </div>
  )
}
