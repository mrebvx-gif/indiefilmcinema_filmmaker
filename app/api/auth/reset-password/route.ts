import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/password'
import { ResetPasswordSchema } from '@/lib/validations/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = ResetPasswordSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      )
    }

    const { token, newPassword } = result.data
    const record = await db.passwordResetToken.findUnique({ where: { token } })

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'This reset link is invalid or has expired.' },
        { status: 400 }
      )
    }

    const newHash = await hashPassword(newPassword)

    await db.$transaction([
      db.user.update({
        where: { id: record.userId },
        data: { passwordHash: newHash },
      }),
      db.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ])

    return NextResponse.json({ message: 'Password updated successfully.' })
  } catch (error) {
    console.error('[AUTH_RESET_PASSWORD]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
