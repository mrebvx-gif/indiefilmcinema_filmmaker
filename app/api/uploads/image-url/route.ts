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
