import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import { db } from '@/lib/db'
import { verifyPassword } from '@/lib/password'
import {
  signAccessToken,
  signRefreshToken,
} from '@/lib/auth'
import { LoginSchema } from '@/lib/validations/auth'

export async function POST(request: NextRequest) {
  try {
    // Rate limit check
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1"
    const { success } = await rateLimit.limit(ip)
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    const body = await request.json()
    const result = LoginSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const { email, password } = result.data
    const user = await db.user.findUnique({ where: { email } })

    // Generic error — don't reveal whether email exists
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    if (!user.isEmailVerified) {
      return NextResponse.json(
        { error: 'Please verify your email before logging in', code: 'EMAIL_NOT_VERIFIED' },
        { status: 403 }
      )
    }

    if (user.isSuspended) {
      return NextResponse.json(
        { error: 'Your account has been suspended' },
        { status: 403 }
      )
    }

    const authUser = { userId: user.id, email: user.email, fullName: user.fullName }
    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken(authUser),
      signRefreshToken(user.id),
    ])

    const response = NextResponse.json({
      accessToken,
      user: { id: user.id, email: user.email, fullName: user.fullName },
    })

    // Set refresh token as HTTP-only cookie on the response
    response.cookies.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    // Also set access token in a regular cookie for middleware
    response.cookies.set('access_token', accessToken, {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 15, // 15 minutes
      path: '/',
    })

    // Check subscription status to prepopulate fast-path cookie
    const subscription = await db.subscription.findUnique({
      where: { userId: user.id },
      select: { status: true },
    })

    if (subscription?.status === 'ACTIVE') {
      response.cookies.set('auth_subscription_active', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 1 week
      })
    }

    return response
  } catch (error) {
    console.error('[AUTH_LOGIN]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
