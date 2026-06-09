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
