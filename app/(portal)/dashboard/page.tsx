'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { authFetch } from '@/lib/auth-client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Film, PlusCircle, CreditCard, Clock, CheckCircle2, AlertCircle } from 'lucide-react'

type FilmSubmission = {
  id: string
  filmTitle: string
  primaryGenre: string
  status: string
  submittedAt: string
  thumbnailBunnyUrl: string
  runningTimeSeconds: number
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${s}s`
}

export default function DashboardPage() {
  const [films, setFilms] = useState<FilmSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [billingLoading, setBillingLoading] = useState(false)

  useEffect(() => {
    async function loadFilms() {
      try {
        const res = await authFetch('/api/films')
        if (res.ok) {
          const data = await res.json()
          setFilms(data)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadFilms()
  }, [])

  const handleManageBilling = async () => {
    setBillingLoading(true)
    try {
      const res = await authFetch('/api/subscriptions/portal-url')
      if (res.ok) {
        const { portalUrl } = await res.json()
        window.open(portalUrl, '_blank')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setBillingLoading(false)
    }
  }

  return (
    <div className="container mx-auto max-w-7xl py-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Your Filmmaker Portal</h1>
          <p className="text-muted-foreground mt-2 text-lg">Manage your submissions and subscription.</p>
        </div>
        <div className="flex gap-4">
          <Button 
            variant="outline" 
            onClick={handleManageBilling} 
            disabled={billingLoading}
            className="h-12 border-border/50 bg-background/50 backdrop-blur-sm"
          >
            {billingLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CreditCard className="w-4 h-4 mr-2" />}
            Manage Billing
          </Button>
          <Link href="/submit">
            <Button className="h-12 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
              <PlusCircle className="w-4 h-4 mr-2" />
              Upload New Film
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="mt-4 text-muted-foreground animate-pulse">Loading your cinematic universe...</p>
        </div>
      ) : films.length === 0 ? (
        <Card className="bg-card/30 backdrop-blur-xl border-border/50 border-dashed py-16 text-center">
          <CardContent className="flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <Film className="w-10 h-10 text-primary" />
            </div>
            <CardTitle className="text-2xl mb-2">No films submitted yet</CardTitle>
            <CardDescription className="text-base max-w-md mx-auto mb-8">
              Your portal is unlocked and ready. Upload your first masterpiece to officially enter the festival circuit.
            </CardDescription>
            <Link href="/submit">
              <Button size="lg" className="h-14 px-8 text-base">Start Your First Submission</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {films.map((film) => (
            <Link key={film.id} href={`/submissions/${film.id}`}>
              <Card className="group h-full bg-card/40 backdrop-blur-md border-border/50 hover:border-primary/50 transition-all duration-300 overflow-hidden cursor-pointer shadow-lg hover:shadow-primary/10">
                <div className="relative aspect-video w-full overflow-hidden bg-muted">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
                  <img 
                    src={film.thumbnailBunnyUrl} 
                    alt={film.filmTitle}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute bottom-3 left-3 right-3 z-20 flex justify-between items-end">
                    <span className="px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md text-xs font-medium text-white/90 border border-white/10">
                      {film.primaryGenre}
                    </span>
                    <span className="flex items-center text-xs font-medium text-white/80">
                      <Clock className="w-3 h-3 mr-1" /> {formatDuration(film.runningTimeSeconds)}
                    </span>
                  </div>
                </div>
                <CardContent className="p-5">
                  <h3 className="font-bold text-lg text-foreground line-clamp-1 mb-1 group-hover:text-primary transition-colors">
                    {film.filmTitle}
                  </h3>
                  <div className="flex justify-between items-center mt-4">
                    <span className="text-xs text-muted-foreground flex items-center">
                      Submitted: {new Date(film.submittedAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center text-xs font-medium px-2 py-1 rounded-full bg-green-500/10 text-green-500 border border-green-500/20">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> {film.status}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
