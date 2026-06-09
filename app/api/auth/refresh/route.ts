import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  verifyRefreshToken,
  signAccessToken,
  signRefreshToken,
} from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('refresh_token')?.value
    if (!refreshToken) {
      return NextResponse.json({ error: 'No refresh token' }, { status: 401 })
    }

    const payload = await verifyRefreshToken(refreshToken)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid refresh token' }, { status: 401 })
    }

    const user = await db.user.findUnique({ where: { id: payload.userId } })
    if (!user || user.isSuspended) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const authUser = { userId: user.id, email: user.email, fullName: user.fullName }
    const [newAccessToken, newRefreshToken] = await Promise.all([
      signAccessToken(authUser),
      signRefreshToken(user.id),
    ])

    const response = NextResponse.json({ accessToken: newAccessToken })
    response.cookies.set('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('[AUTH_REFRESH]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
