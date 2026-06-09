# Phase 3 — Upload Infrastructure (BunnyCDN)

> **Goal:** Build the secure API routes that allow the browser to upload huge video files and images directly to BunnyCDN without passing through Vercel's serverless functions.
>
> **When this phase is done:** The `/lib/bunny.ts` functions are implemented and three new API endpoints exist. You can test uploading a video and an image using a generic HTTP client (like Postman or a simple HTML form), bypassing Vercel limits.

---

## What Gets Built in This Phase

**Lib files (fully implemented):**
- `lib/bunny.ts` — Video and image URL generation, video confirmation.

**API Routes:**
- `POST /api/uploads/video-url`
- `POST /api/uploads/image-url`
- `POST /api/uploads/confirm-video`

---

## Step 3.1 — Implement `lib/bunny.ts`

Replace the stub from Phase 0 with the full implementation:

```typescript
import { config } from './config'

const STREAM_API_URL = 'https://video.bunnycdn.com/library'
const STORAGE_API_URL = 'https://storage.bunnycdn.com'

export async function generateVideoUploadUrl(
  title: string
): Promise<{ bunnyVideoId: string; uploadUrl: string }> {
  // 1. Create a video object in the stream library
  const createResponse = await fetch(
    `${STREAM_API_URL}/${config.bunny.streamLibraryId}/videos`,
    {
      method: 'POST',
      headers: {
        AccessKey: config.bunny.streamAccessKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ title }),
    }
  )

  if (!createResponse.ok) {
    throw new Error('Failed to create BunnyCDN video object')
  }

  const videoData = await createResponse.json()
  const bunnyVideoId = videoData.guid

  // 2. The upload URL is a direct PUT endpoint
  const uploadUrl = `${STREAM_API_URL}/${config.bunny.streamLibraryId}/videos/${bunnyVideoId}`

  return { bunnyVideoId, uploadUrl }
}

export async function generateImageUploadUrl(
  filename: string,
  userId: string,
  purpose: 'poster' | 'thumbnail'
): Promise<{ objectName: string; uploadUrl: string; publicUrl: string }> {
  // Generate a unique path: films/{userId}/{timestamp}-{filename}
  const timestamp = Date.now()
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_')
  const objectName = `films/${userId}/${purpose}-${timestamp}-${sanitizedFilename}`

  const uploadUrl = `${STORAGE_API_URL}/${config.bunny.storageZoneName}/${objectName}`
  const publicUrl = `${config.bunny.storageCdnUrl}/${objectName}`

  return { objectName, uploadUrl, publicUrl }
}

export async function confirmVideoUpload(
  bunnyVideoId: string
): Promise<{ confirmed: boolean; reason?: string }> {
  const response = await fetch(
    `${STREAM_API_URL}/${config.bunny.streamLibraryId}/videos/${bunnyVideoId}`,
    {
      method: 'GET',
      headers: {
        AccessKey: config.bunny.streamAccessKey,
        Accept: 'application/json',
      },
    }
  )

  if (!response.ok) {
    return { confirmed: false, reason: 'Video not found in BunnyCDN' }
  }

  const data = await response.json()
  
  // Status 0: Created, 1: Uploaded, 2: Processing, 3: Transcoding, 4: Finished, 5: Error, 6: UploadFailed
  if (data.status === 5 || data.status === 6) {
    return { confirmed: false, reason: 'Video upload failed or errored in BunnyCDN' }
  }

  // We consider it confirmed if it is at least status 1 (Uploaded)
  if (data.status >= 1 && data.status <= 4) {
    return { confirmed: true }
  }

  return { confirmed: false, reason: 'Video is still waiting for upload' }
}
```

---

## Step 3.2 — Implement Upload API Routes

### `app/api/uploads/video-url/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { generateVideoUploadUrl } from '@/lib/bunny'
import { VideoUploadUrlSchema } from '@/lib/validations/uploads'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const result = VideoUploadUrlSchema.safeParse(body)
    
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    // Pass the original filename to BunnyCDN so it shows up in their dashboard
    const { bunnyVideoId, uploadUrl } = await generateVideoUploadUrl(result.data.filename)

    return NextResponse.json({
      bunnyVideoId,
      uploadUrl,
      // Provide headers the frontend needs to use for the PUT request
      headers: {
        AccessKey: process.env.BUNNY_STREAM_ACCESS_KEY,
        'Content-Type': 'application/octet-stream',
      }
    })
  } catch (error) {
    console.error('[UPLOAD_VIDEO_URL]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

### `app/api/uploads/image-url/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { generateImageUploadUrl } from '@/lib/bunny'
import { ImageUploadUrlSchema } from '@/lib/validations/uploads'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const result = ImageUploadUrlSchema.safeParse(body)
    
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid input', details: result.error.format() }, { status: 400 })
    }

    const { objectName, uploadUrl, publicUrl } = await generateImageUploadUrl(
      result.data.filename,
      user.userId,
      result.data.purpose
    )

    return NextResponse.json({
      objectName,
      uploadUrl,
      publicUrl,
      headers: {
        AccessKey: process.env.BUNNY_STORAGE_ACCESS_KEY,
        'Content-Type': 'application/octet-stream',
      }
    })
  } catch (error) {
    console.error('[UPLOAD_IMAGE_URL]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

### `app/api/uploads/confirm-video/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { confirmVideoUpload } from '@/lib/bunny'
import { ConfirmVideoSchema } from '@/lib/validations/uploads'

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const result = ConfirmVideoSchema.safeParse(body)
    
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }

    const confirmation = await confirmVideoUpload(result.data.bunnyVideoId)

    if (!confirmation.confirmed) {
      return NextResponse.json(
        { error: confirmation.reason },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[CONFIRM_VIDEO]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

---

## Phase 3 Verification Checklist

- [ ] `POST /api/uploads/video-url` returns a `bunnyVideoId` and an `uploadUrl`
- [ ] You can perform an HTTP PUT to the returned `uploadUrl` with a small video file and headers `AccessKey` and `Content-Type: application/octet-stream`
- [ ] `POST /api/uploads/confirm-video` returns `{ "success": true }` for the uploaded video ID
- [ ] `POST /api/uploads/image-url` returns `objectName`, `uploadUrl`, and `publicUrl`
- [ ] You can perform an HTTP PUT to the returned image `uploadUrl` with an image file and headers `AccessKey` and `Content-Type: application/octet-stream`
- [ ] Navigating to the `publicUrl` of the uploaded image in your browser displays the image

---

*Phase 3 complete → Proceed to [Phase 4 — Film Submission Form](./05_PHASE_4_SUBMISSION.md)*
