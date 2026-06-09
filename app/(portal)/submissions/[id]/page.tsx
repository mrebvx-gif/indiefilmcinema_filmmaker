'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { authFetch } from '@/lib/auth-client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, ArrowLeft, Calendar, MapPin, Film, PlayCircle, Globe2 } from 'lucide-react'

type FilmDetail = {
  id: string
  filmTitle: string
  logline: string
  runningTimeSeconds: number
  primaryGenre: string
  countryOfOrigin: string
  targetCountries: string[]
  targetReleaseYear: number | null
  directorName: string
  producerName: string | null
  writerName: string | null
  cinematographerName: string | null
  marketInterests: string[]
  narrativeScale: number
  posterBunnyUrl: string | null
  thumbnailBunnyUrl: string
  youtubeTrailerUrl: string
  status: string
  submittedAt: string
}

export default function SubmissionDetailPage() {
  const { id } = useParams()
  const [film, setFilm] = useState<FilmDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadFilm() {
      try {
        const res = await authFetch(`/api/films/${id}`)
        if (!res.ok) throw new Error('Failed to load submission')
        const data = await res.json()
        setFilm(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    if (id) loadFilm()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    )
  }

  if (error || !film) {
    return (
      <div className="container py-20 text-center">
        <h2 className="text-2xl font-bold text-destructive mb-4">Error Loading Film</h2>
        <p className="text-muted-foreground mb-8">{error || 'Film not found.'}</p>
        <Link href="/dashboard">
          <Button variant="outline">Return to Dashboard</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="container max-w-5xl py-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <Link href="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-8">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Left Column: Media & Primary Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-xl overflow-hidden border border-border/50 shadow-2xl relative aspect-[2/3] bg-muted">
            {film.posterBunnyUrl ? (
              <img src={film.posterBunnyUrl} alt="Poster" className="w-full h-full object-cover" />
            ) : (
              <img src={film.thumbnailBunnyUrl} alt="Thumbnail" className="w-full h-full object-cover" />
            )}
            <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-xs font-semibold text-white border border-white/10 uppercase tracking-wider">
              {film.status}
            </div>
          </div>

          <Card className="bg-card/40 backdrop-blur-md border-border/50">
            <CardContent className="p-6 space-y-4">
              <Button className="w-full" variant="outline" onClick={() => window.open(film.youtubeTrailerUrl, '_blank')}>
                <PlayCircle className="w-4 h-4 mr-2" /> Watch Trailer
              </Button>
              <div className="space-y-3 pt-2 text-sm">
                <div className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Running Time</span>
                  <span className="font-medium text-foreground">{Math.floor(film.runningTimeSeconds / 60)}m {film.runningTimeSeconds % 60}s</span>
                </div>
                <div className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Genre</span>
                  <span className="font-medium text-foreground">{film.primaryGenre}</span>
                </div>
                <div className="flex justify-between border-b border-border/50 pb-2">
                  <span className="text-muted-foreground">Submitted</span>
                  <span className="font-medium text-foreground">{new Date(film.submittedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Detailed Metadata */}
        <div className="lg:col-span-2 space-y-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-foreground">
              {film.filmTitle}
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed italic border-l-4 border-primary/50 pl-4 py-1">
              "{film.logline}"
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-card/40 backdrop-blur-md border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <Film className="w-5 h-5 mr-2 text-primary" /> Cast & Crew
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-muted-foreground col-span-1">Director</span>
                  <span className="font-medium col-span-2">{film.directorName}</span>
                </div>
                {film.producerName && (
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-muted-foreground col-span-1">Producer</span>
                    <span className="font-medium col-span-2">{film.producerName}</span>
                  </div>
                )}
                {film.writerName && (
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-muted-foreground col-span-1">Writer</span>
                    <span className="font-medium col-span-2">{film.writerName}</span>
                  </div>
                )}
                {film.cinematographerName && (
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-muted-foreground col-span-1">DoP</span>
                    <span className="font-medium col-span-2">{film.cinematographerName}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card/40 backdrop-blur-md border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <Globe2 className="w-5 h-5 mr-2 text-accent" /> Market & Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-muted-foreground col-span-1">Origin</span>
                  <span className="font-medium col-span-2">{film.countryOfOrigin}</span>
                </div>
                {film.targetReleaseYear && (
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-muted-foreground col-span-1">Release Yr</span>
                    <span className="font-medium col-span-2">{film.targetReleaseYear}</span>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-muted-foreground col-span-1">Scale (1-7)</span>
                  <span className="font-medium col-span-2">{film.narrativeScale} / 7</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {(film.marketInterests.length > 0 || film.targetCountries.length > 0) && (
            <Card className="bg-card/40 backdrop-blur-md border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Tags & Interests</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {film.marketInterests.map(interest => (
                  <span key={interest} className="px-3 py-1 rounded-full bg-accent/10 text-accent border border-accent/20 text-xs font-medium">
                    {interest.replace('_', ' ')}
                  </span>
                ))}
                {film.targetCountries.map(country => (
                  <span key={country} className="px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-medium flex items-center">
                    <MapPin className="w-3 h-3 mr-1" /> {country}
                  </span>
                ))}
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  )
}
