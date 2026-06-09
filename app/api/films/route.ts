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
        filmakerId: user.userId,
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
        status: 'SUBMITTED',
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
