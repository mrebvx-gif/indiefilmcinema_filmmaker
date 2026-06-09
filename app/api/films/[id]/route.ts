import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const submission = await db.filmSubmission.findUnique({
      where: { id }
    })

    if (!submission) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Ensure the filmmaker only sees their own submissions
    if (submission.filmakerId !== user.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(submission)
  } catch (error) {
    console.error('[FILMS_GET_BY_ID]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
