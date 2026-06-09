export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      <div className="z-10 w-full max-w-md px-4 py-12">
        {children}
      </div>
    </div>
  )
}
