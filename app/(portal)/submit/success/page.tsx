import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Film } from 'lucide-react'

export default function SubmitSuccessPage() {
  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center p-4 relative overflow-hidden bg-background">
      {/* Background aesthetics */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[20%] left-[20%] w-[40%] h-[40%] rounded-full bg-green-500/10 blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[20%] right-[20%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]" />
      </div>

      <div className="text-center max-w-lg space-y-8 animate-in slide-in-from-bottom-8 fade-in duration-700">
        <div className="relative w-32 h-32 mx-auto">
          <div className="absolute inset-0 bg-green-500/20 rounded-full animate-ping opacity-75" />
          <div className="relative w-full h-full bg-green-500/20 border border-green-500/30 rounded-full flex items-center justify-center backdrop-blur-sm shadow-xl shadow-green-500/20">
            <CheckCircle2 className="w-16 h-16 text-green-500" />
          </div>
        </div>
        
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            Submission Successful!
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Your cinematic masterpiece has been securely uploaded and submitted. You will receive a confirmation email shortly. Our curation team will review your submission before it appears on the platform.
          </p>
        </div>

        <div className="pt-8 grid gap-4 md:grid-cols-2">
          <Link href="/dashboard" className="w-full">
            <Button size="lg" variant="outline" className="w-full h-14 text-base border-border/50 hover:bg-muted/50">
              Return to Dashboard
            </Button>
          </Link>
          <Link href="/submit" className="w-full">
            <Button size="lg" className="w-full h-14 text-base bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20">
              <Film className="w-5 h-5 mr-2" />
              Submit Another
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
