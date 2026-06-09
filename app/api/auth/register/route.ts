import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/password'
import { sendVerificationEmail } from '@/lib/email'
import { RegisterSchema } from '@/lib/validations/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = RegisterSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      )
    }

    const { fullName, email, password } = result.data

    // Check duplicate email
    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    const passwordHash = await hashPassword(password)

    // Create user
    const user = await db.user.create({
      data: { fullName, email, passwordHash },
    })

    // Create verification token (expires 24h)
    const token = crypto.randomBytes(32).toString('hex')
    await db.emailVerificationToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    })

    // Send email (don't await — don't fail registration if email fails)
    sendVerificationEmail(email, token).catch(console.error)

    return NextResponse.json(
      { message: 'Account created. Please check your email to verify your account.' },
      { status: 201 }
    )
  } catch (error) {
    console.error('[AUTH_REGISTER]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
