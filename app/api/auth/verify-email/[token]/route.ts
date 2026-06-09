import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { config } from '@/lib/config'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> | { token: string } }
) {
  const resolvedParams = await params
  const { token } = resolvedParams
  const appUrl = config.app.url

  try {
    const record = await db.emailVerificationToken.findUnique({
      where: { token },
    })

    if (!record) {
      return NextResponse.redirect(`${appUrl}/verify-email?error=invalid`)
    }
    if (record.usedAt) {
      return NextResponse.redirect(`${appUrl}/verify-email?error=used`)
    }
    if (record.expiresAt < new Date()) {
      return NextResponse.redirect(`${appUrl}/verify-email?error=expired`)
    }

    // Mark verified
    await db.$transaction([
      db.user.update({
        where: { id: record.userId },
        data: { isEmailVerified: true },
      }),
      db.emailVerificationToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ])

    return NextResponse.redirect(`${appUrl}/login?verified=true`)
  } catch (error) {
    console.error('[AUTH_VERIFY_EMAIL]', error)
    return NextResponse.redirect(`${appUrl}/verify-email?error=server`)
  }
}
