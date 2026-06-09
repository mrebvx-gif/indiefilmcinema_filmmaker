'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FilmSubmissionSchema, FilmSubmissionInput, GENRES, MARKET_INTERESTS } from '@/lib/validations/films'
import { authFetch } from '@/lib/auth-client'
import { useUploader } from '@/hooks/useUploader'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, UploadCloud, CheckCircle2, AlertCircle } from 'lucide-react'

// Custom upload widget for files
function UploadWidget({ 
  label, 
  accept, 
  onSuccess, 
  purpose 
}: { 
  label: string, 
  accept: string, 
  onSuccess: (data: any) => void, 
  purpose: 'video' | 'poster' | 'thumbnail' 
}) {
  const { uploadVideo, uploadImage, progress, isUploading, error, isSuccess } = useUploader()
  const [fileName, setFileName] = useState('')

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    try {
      if (purpose === 'video') {
        const result = await uploadVideo(file)
        onSuccess(result)
      } else {
        const result = await uploadImage(file, purpose)
        onSuccess(result)
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:bg-muted/30 transition-all relative overflow-hidden group">
      <input 
        type="file" 
        accept={accept} 
        onChange={handleFileChange} 
        disabled={isUploading || isSuccess}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
      />
      
      {/* Background progress indicator */}
      {isUploading && (
        <div 
          className="absolute left-0 bottom-0 top-0 bg-primary/10 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      )}

      <div className="space-y-4 relative z-0">
        {isSuccess ? (
          <CheckCircle2 className="w-12 h-12 mx-auto text-green-500 animate-in zoom-in" />
        ) : isUploading ? (
          <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin" />
        ) : (
          <UploadCloud className="w-12 h-12 mx-auto text-muted-foreground group-hover:text-primary transition-colors" />
        )}
        
        <div className="text-sm font-medium">
          {isSuccess ? (
            <span className="text-green-500">{fileName} successfully uploaded!</span>
          ) : isUploading ? (
            <span className="text-primary">Uploading {Math.round(progress)}%</span>
          ) : (
            <span className="text-foreground">{label}</span>
          )}
        </div>
        
        {!isUploading && !isSuccess && (
          <p className="text-xs text-muted-foreground">Click or drag and drop to upload</p>
        )}

        {error && <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">{error}</div>}
      </div>
    </div>
  )
}

export default function SubmitPage() {
  const router = useRouter()
  const [globalError, setGlobalError] = useState('')

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FilmSubmissionInput>({
    resolver: zodResolver(FilmSubmissionSchema) as any,
    defaultValues: {
      targetCountries: [],
      marketInterests: [],
      narrativeScale: 3,
    }
  })

  const onSubmit = async (data: FilmSubmissionInput) => {
    setGlobalError('')
    try {
      const res = await authFetch('/api/films', {
        method: 'POST',
        body: JSON.stringify(data)
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Submission failed')
      }
      router.push('/submit/success')
    } catch (err: any) {
      setGlobalError(err.message)
    }
  }

  return (
    <div className="container mx-auto max-w-4xl py-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <Card className="bg-card/40 backdrop-blur-xl border-border/50 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 via-accent/50 to-primary/50" />
        
        <CardHeader className="pb-8">
          <CardTitle className="text-4xl font-bold tracking-tight">Submit Your Film</CardTitle>
          <CardDescription className="text-base mt-2">
            Fill in the details below to officially submit your film to the festival. Make sure all assets are high quality.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
            
            {/* 1. Basic Info */}
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold border-b border-border/50 pb-2 text-foreground/90">1. Basic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Film Title <span className="text-destructive">*</span></label>
                  <Input {...register('filmTitle')} placeholder="The Grand Adventure" className={`h-12 bg-background/50 ${errors.filmTitle ? 'border-destructive ring-destructive/20' : ''}`} />
                  {errors.filmTitle && <p className="text-xs text-destructive">{errors.filmTitle.message}</p>}
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Running Time (seconds) <span className="text-destructive">*</span></label>
                  <Input type="number" {...register('runningTimeSeconds', { valueAsNumber: true })} placeholder="5400" className={`h-12 bg-background/50 ${errors.runningTimeSeconds ? 'border-destructive ring-destructive/20' : ''}`} />
                  {errors.runningTimeSeconds && <p className="text-xs text-destructive">{errors.runningTimeSeconds.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Logline <span className="text-destructive">*</span></label>
                <Textarea {...register('logline')} placeholder="A short summary of your film... (min 20 chars)" className={`min-h-[120px] bg-background/50 ${errors.logline ? 'border-destructive ring-destructive/20' : ''}`} />
                {errors.logline && <p className="text-xs text-destructive">{errors.logline.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Primary Genre <span className="text-destructive">*</span></label>
                  <select {...register('primaryGenre')} className={`flex h-12 w-full rounded-md border bg-background/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 ${errors.primaryGenre ? 'border-destructive' : 'border-input'}`}>
                    <option value="">Select Genre...</option>
                    {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                  {errors.primaryGenre && <p className="text-xs text-destructive">{errors.primaryGenre.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Country of Origin <span className="text-destructive">*</span></label>
                  <Input {...register('countryOfOrigin')} placeholder="e.g. USA, UK, France" className={`h-12 bg-background/50 ${errors.countryOfOrigin ? 'border-destructive ring-destructive/20' : ''}`} />
                  {errors.countryOfOrigin && <p className="text-xs text-destructive">{errors.countryOfOrigin.message}</p>}
                </div>
              </div>
            </div>

            {/* 2. Cast & Crew */}
            <div className="space-y-6 pt-4">
              <h3 className="text-2xl font-semibold border-b border-border/50 pb-2 text-foreground/90">2. Cast & Crew</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Director Name <span className="text-destructive">*</span></label>
                  <Input {...register('directorName')} placeholder="Jane Doe" className={`h-12 bg-background/50 ${errors.directorName ? 'border-destructive ring-destructive/20' : ''}`} />
                  {errors.directorName && <p className="text-xs text-destructive">{errors.directorName.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Producer Name</label>
                  <Input {...register('producerName')} placeholder="John Smith" className="h-12 bg-background/50" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Writer Name</label>
                  <Input {...register('writerName')} placeholder="Jane Doe" className="h-12 bg-background/50" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cinematographer</label>
                  <Input {...register('cinematographerName')} placeholder="Roger Deakins" className="h-12 bg-background/50" />
                </div>
              </div>
            </div>

            {/* 3. Market & Distribution */}
            <div className="space-y-6 pt-4">
              <h3 className="text-2xl font-semibold border-b border-border/50 pb-2 text-foreground/90">3. Market & Distribution</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Target Release Year</label>
                  <Input type="number" {...register('targetReleaseYear', { setValueAs: (v) => v === '' || Number.isNaN(Number(v)) ? null : Number(v) })} placeholder="e.g. 2026" className={`h-12 bg-background/50 ${errors.targetReleaseYear ? 'border-destructive ring-destructive/20' : ''}`} />
                  {errors.targetReleaseYear && <p className="text-xs text-destructive">{errors.targetReleaseYear.message}</p>}
                </div>
                
                <div className="space-y-3">
                  <label className="text-sm font-medium">Narrative Scale (1-7) <span className="text-destructive">*</span></label>
                  <p className="text-xs text-muted-foreground">1 = Highly Traditional, 7 = Highly Experimental</p>
                  <div className="flex justify-between items-center bg-background/50 p-3 rounded-md border border-input">
                    {[1, 2, 3, 4, 5, 6, 7].map(num => (
                      <label key={num} className="flex flex-col items-center gap-1 cursor-pointer">
                        <span className="text-xs font-medium">{num}</span>
                        <input type="radio" value={num} {...register('narrativeScale', { valueAsNumber: true })} className="w-4 h-4 accent-primary" />
                      </label>
                    ))}
                  </div>
                  {errors.narrativeScale && <p className="text-xs text-destructive">{errors.narrativeScale.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-sm font-medium">Target Countries</label>
                  <p className="text-xs text-muted-foreground">Where would you like to show your film?</p>
                  <div className="space-y-2 bg-background/50 p-4 rounded-md border border-input">
                    {['Worldwide', 'USA', 'UK', 'Europe', 'Asia', 'Canada'].map(country => (
                      <label key={country} className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" value={country} {...register('targetCountries')} className="w-4 h-4 rounded border-gray-300 text-primary accent-primary" />
                        <span className="text-sm">{country}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium">Market Interests</label>
                  <p className="text-xs text-muted-foreground">Select all potential markets</p>
                  <div className="space-y-2 bg-background/50 p-4 rounded-md border border-input">
                    {MARKET_INTERESTS.map(interest => (
                      <label key={interest} className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" value={interest} {...register('marketInterests')} className="w-4 h-4 rounded border-gray-300 text-primary accent-primary" />
                        <span className="text-sm">{interest.replace(/_/g, ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Media & Assets */}
            <div className="space-y-6 pt-4">
              <h3 className="text-2xl font-semibold border-b border-border/50 pb-2 text-foreground/90">4. Media & Assets</h3>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">YouTube Trailer URL <span className="text-destructive">*</span></label>
                <Input {...register('youtubeTrailerUrl')} placeholder="https://youtube.com/watch?v=..." className={`h-12 bg-background/50 ${errors.youtubeTrailerUrl ? 'border-destructive ring-destructive/20' : ''}`} />
                {errors.youtubeTrailerUrl && <p className="text-xs text-destructive">{errors.youtubeTrailerUrl.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                <div className="space-y-3">
                  <label className="text-sm font-medium flex items-center gap-2">
                    Film Thumbnail (16:9) <span className="text-destructive">*</span>
                  </label>
                  <UploadWidget 
                    purpose="thumbnail" 
                    accept="image/*" 
                    label="Upload High-Res Thumbnail" 
                    onSuccess={(data) => {
                      setValue('thumbnailBunnyUrl', data.publicUrl, { shouldValidate: true })
                      setValue('thumbnailBunnyObject', data.objectName, { shouldValidate: true })
                    }} 
                  />
                  {errors.thumbnailBunnyUrl && <p className="text-xs text-destructive font-medium">{errors.thumbnailBunnyUrl.message}</p>}
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium flex items-center gap-2">
                    Main Video File <span className="text-destructive">*</span>
                  </label>
                  <UploadWidget 
                    purpose="video" 
                    accept="video/*" 
                    label="Upload Video (Max 100GB, MP4/MOV)" 
                    onSuccess={(data) => {
                      setValue('videoBunnyVideoId', data.bunnyVideoId, { shouldValidate: true })
                      setValue('videoBunnyLibraryId', data.bunnyLibraryId, { shouldValidate: true })
                    }} 
                  />
                  {errors.videoBunnyVideoId && <p className="text-xs text-destructive font-medium">{errors.videoBunnyVideoId.message}</p>}
                </div>
              </div>
            </div>

            {globalError && (
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-3">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p className="font-medium">{globalError}</p>
              </div>
            )}

            <div className="pt-6">
              <Button type="submit" disabled={isSubmitting} className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/20 transition-all">
                {isSubmitting ? <Loader2 className="w-6 h-6 mr-3 animate-spin" /> : null}
                {isSubmitting ? 'Processing Submission...' : 'Submit Film Officially'}
              </Button>
              <p className="text-center text-xs text-muted-foreground mt-4">
                By submitting, you confirm that you own all rights to this film and its assets.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
