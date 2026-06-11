import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const subscription = await db.subscription.findUnique({
      where: { userId: user.userId },
      select: { status: true, currentPeriodEnd: true },
    })

    if (!subscription) {
      return NextResponse.json({
        status: 'NONE',
        isActive: false,
        currentPeriodEnd: null,
      })
    }

    return NextResponse.json({
      status: subscription.status,
      isActive: subscription.status === 'ACTIVE',
      currentPeriodEnd: subscription.currentPeriodEnd,
    })
  } catch (error) {
    console.error('[SUBSCRIPTIONS_STATUS]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
