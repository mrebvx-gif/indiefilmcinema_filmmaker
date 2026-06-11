import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'
import crypto from 'crypto'
import { db } from '@/lib/db'
import { sendPasswordResetEmail } from '@/lib/email'
import { ForgotPasswordSchema } from '@/lib/validations/auth'

export async function POST(request: NextRequest) {
  try {
    // Rate limit check
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1"
    const { success } = await rateLimit.limit(ip)
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 })
    }

    const body = await request.json()
    const result = ForgotPasswordSchema.safeParse(body)
    if (!result.success) {
      // Always return 200 — no user enumeration
      return NextResponse.json({ message: 'If that email exists, a reset link was sent.' })
    }

    const { email } = result.data
    const user = await db.user.findUnique({ where: { email } })

    if (user) {
      const token = crypto.randomBytes(32).toString('hex')
      await db.passwordResetToken.create({
        data: {
          userId: user.id,
          token,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        },
      })
      sendPasswordResetEmail(email, token).catch(console.error)
    }

    return NextResponse.json({ message: 'If that email exists, a reset link was sent.' })
  } catch (error) {
    console.error('[AUTH_FORGOT_PASSWORD]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
