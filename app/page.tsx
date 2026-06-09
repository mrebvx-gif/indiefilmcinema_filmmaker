import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PlayCircle, Film, ArrowRight } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen overflow-hidden">
      
      {/* Navigation */}
      <nav className="fixed top-0 left-0 w-full z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Film className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold tracking-tight uppercase">IndieFilm Cinema</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="font-semibold tracking-wide">LOGIN</Button>
            </Link>
            <Link href="/dashboard">
              <Button className="bg-primary text-primary-foreground font-bold hover:bg-primary/90 px-6">
                PORTAL <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 flex flex-col items-center justify-center min-h-screen text-center px-4">
        


        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-12 duration-1000 relative z-10">
          <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary uppercase tracking-widest mb-4">
            <PlayCircle className="w-4 h-4 mr-2" />
            Now Accepting Submissions
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-heading font-bold uppercase leading-[1.1]">
            Elevate Your <br />
            <span className="text-primary">Indie Masterpiece.</span>
          </h1>
          
          <p className="text-lg md:text-2xl text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
            The exclusive gateway for independent filmmakers to showcase, distribute, and monetize visionary cinema worldwide.
          </p>
          
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto h-16 px-10 text-lg font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_40px_-10px_rgba(255,204,0,0.5)] transition-all uppercase tracking-widest">
                Submit Your Film
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-16 px-10 text-lg font-bold border-border/50 hover:bg-muted uppercase tracking-widest">
                Filmmaker Login
              </Button>
            </Link>
          </div>
        </div>

      </main>
    </div>
  )
}
