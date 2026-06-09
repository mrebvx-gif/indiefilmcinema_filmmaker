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
      bunnyLibraryId: process.env.BUNNY_STREAM_LIBRARY_ID,
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
