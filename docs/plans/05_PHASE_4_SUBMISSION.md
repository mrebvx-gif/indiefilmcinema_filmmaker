# Phase 4 — Film Submission Form

> **Goal:** Create the multi-section film submission form on the frontend and the corresponding POST API route.
>
> **When this phase is done:** A subscribed filmmaker can visit `/submit`, fill in all required film details, directly upload their video and image assets, and submit the form to save the data in the database.

---

## What Gets Built in This Phase

**API Routes:**
- `POST /api/films`

**Pages:**
- `/submit` — The multi-section submission form
- `/submit/success` — Confirmation page after successful submission

---

## Step 4.1 — Implement `POST /api/films`

Create `app/api/films/route.ts` and add the POST handler (the GET handler will be built in Phase 5).

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { FilmSubmissionSchema } from '@/lib/validations/films'
import { confirmVideoUpload } from '@/lib/bunny'
import { sendSubmissionConfirmationEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Optional: Re-verify subscription status here if desired
    // (Middleware already catches this, but an extra safety check ensures API integrity)
    const subscription = await db.subscription.findUnique({
      where: { userId: user.userId }
    })
    
    if (!subscription || subscription.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Active subscription required' }, { status: 403 })
    }

    const body = await request.json()
    const result = FilmSubmissionSchema.safeParse(body)
    
    if (!result.success) {
      return NextResponse.json({ error: 'Validation failed', details: result.error.flatten() }, { status: 400 })
    }

    const data = result.data

    // Re-confirm video upload before inserting into DB
    const confirmation = await confirmVideoUpload(data.videoBunnyVideoId)
    if (!confirmation.confirmed) {
      return NextResponse.json({ error: 'Video upload is not confirmed' }, { status: 400 })
    }

    // Insert record into DB
    const submission = await db.filmSubmission.create({
      data: {
        filmmakerId: user.userId,
        filmTitle: data.filmTitle,
        logline: data.logline,
        runningTimeSeconds: data.runningTimeSeconds,
        primaryGenre: data.primaryGenre,
        countryOfOrigin: data.countryOfOrigin,
        targetCountries: data.targetCountries,
        targetReleaseYear: data.targetReleaseYear,
        directorName: data.directorName,
        producerName: data.producerName,
        writerName: data.writerName,
        cinematographerName: data.cinematographerName,
        marketInterests: data.marketInterests,
        narrativeScale: data.narrativeScale,
        posterBunnyUrl: data.posterBunnyUrl,
        posterBunnyObject: data.posterBunnyObject,
        thumbnailBunnyUrl: data.thumbnailBunnyUrl,
        thumbnailBunnyObject: data.thumbnailBunnyObject,
        youtubeTrailerUrl: data.youtubeTrailerUrl,
        videoBunnyVideoId: data.videoBunnyVideoId,
        videoBunnyLibraryId: data.videoBunnyLibraryId,
        status: 'SUBMITTED', // Default status
      }
    })

    // Send confirmation email
    sendSubmissionConfirmationEmail(user.email, user.fullName, data.filmTitle).catch(console.error)

    return NextResponse.json(submission, { status: 201 })
  } catch (error) {
    console.error('[FILMS_POST]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

---

## Step 4.2 — Build the Upload Hook

Create a reusable hook `hooks/useUploader.ts` to manage direct-to-BunnyCDN uploads.

```typescript
import { useState } from 'react'
import { authFetch } from '@/lib/auth-client'

interface UploadState {
  progress: number
  isUploading: boolean
  error: string | null
  isSuccess: boolean
}

export function useUploader() {
  const [state, setState] = useState<UploadState>({
    progress: 0,
    isUploading: false,
    error: null,
    isSuccess: false,
  })

  const uploadVideo = async (file: File) => {
    setState({ progress: 0, isUploading: true, error: null, isSuccess: false })
    try {
      // 1. Get Upload URL
      const urlRes = await authFetch('/api/uploads/video-url', {
        method: 'POST',
        body: JSON.stringify({ filename: file.name, fileSizeBytes: file.size })
      })
      
      if (!urlRes.ok) throw new Error('Failed to get upload URL')
      const { bunnyVideoId, uploadUrl, headers } = await urlRes.json()

      // 2. Direct PUT to BunnyCDN using XMLHttpRequest for progress
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('PUT', uploadUrl, true)
        
        xhr.setRequestHeader('AccessKey', headers.AccessKey)
        xhr.setRequestHeader('Content-Type', headers['Content-Type'])

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100
            setState(prev => ({ ...prev, progress: percentComplete }))
          }
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve()
          } else {
            reject(new Error('Upload failed'))
          }
        }

        xhr.onerror = () => reject(new Error('Upload error'))
        xhr.send(file)
      })

      // 3. Confirm Video
      const confirmRes = await authFetch('/api/uploads/confirm-video', {
        method: 'POST',
        body: JSON.stringify({ bunnyVideoId })
      })

      if (!confirmRes.ok) throw new Error('Failed to confirm upload')

      setState({ progress: 100, isUploading: false, error: null, isSuccess: true })
      return { bunnyVideoId }
    } catch (err: any) {
      setState({ progress: 0, isUploading: false, error: err.message, isSuccess: false })
      throw err
    }
  }

  const uploadImage = async (file: File, purpose: 'poster' | 'thumbnail') => {
    setState({ progress: 0, isUploading: true, error: null, isSuccess: false })
    try {
      const urlRes = await authFetch('/api/uploads/image-url', {
        method: 'POST',
        body: JSON.stringify({ filename: file.name, fileSizeBytes: file.size, purpose })
      })

      if (!urlRes.ok) throw new Error('Failed to get upload URL')
      const { objectName, uploadUrl, publicUrl, headers } = await urlRes.json()

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('PUT', uploadUrl, true)
        
        xhr.setRequestHeader('AccessKey', headers.AccessKey)
        xhr.setRequestHeader('Content-Type', headers['Content-Type'])

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100
            setState(prev => ({ ...prev, progress: percentComplete }))
          }
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve()
          else reject(new Error('Upload failed'))
        }

        xhr.onerror = () => reject(new Error('Upload error'))
        xhr.send(file)
      })

      setState({ progress: 100, isUploading: false, error: null, isSuccess: true })
      return { objectName, publicUrl }
    } catch (err: any) {
      setState({ progress: 0, isUploading: false, error: err.message, isSuccess: false })
      throw err
    }
  }

  return { ...state, uploadVideo, uploadImage }
}
```

---

## Step 4.3 — Build the `/submit` Form Page

Create `app/(portal)/submit/page.tsx`.

Requirements for this form:
- Build a multi-step or single long scrolling form matching the `FilmSubmissionSchema`.
- Input fields for Text, Numbers, Selects (Genres, Scale).
- A custom file upload widget using `useUploader()` for the **Video File**. Once successfully uploaded, store the `bunnyVideoId` in the form state.
- Custom file upload widgets using `useUploader()` for **Poster** and **Thumbnail** images. Display the `publicUrl` as a preview image once uploaded.
- Ensure all fields are correctly populated before enabling the final Submit button.
- Call `POST /api/films` on submit.
- On success, `router.push('/submit/success')`.

*(Note: Use `react-hook-form` and `@hookform/resolvers/zod` with your `FilmSubmissionSchema` for robust client-side validation.)*

---

## Step 4.4 — Success Page

Create `app/(portal)/submit/success/page.tsx`.

```tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function SubmitSuccessPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-md space-y-4">
        <h1 className="text-3xl font-bold text-green-500">Submission Successful!</h1>
        <p className="text-muted-foreground">
          Your film has been successfully received. You will receive a confirmation email shortly.
          Our team will review your submission before it appears on the platform.
        </p>
        <Link href="/dashboard">
          <Button className="mt-6 w-full">Return to Dashboard</Button>
        </Link>
      </div>
    </div>
  )
}
```

---

## Phase 4 Verification Checklist

- [x] A logged in user with an active subscription can access `/submit`.
- [x] Attempting to submit without required fields triggers client-side validation errors.
- [x] Uploading a video updates the progress bar, reaches 100%, and successfully fetches confirmation.
- [x] Uploading a poster/thumbnail shows the image preview immediately.
- [x] Clicking Submit successfully calls `POST /api/films` and creates a record in the database.
- [x] You are redirected to `/submit/success`.
- [x] The filmmaker receives a submission confirmation email.

---

*Phase 4 complete → Proceed to [Phase 5 — Dashboard & History](./06_PHASE_5_DASHBOARD.md)*
