import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'
import { getCustomerPortalUrl } from '@/lib/lemonsqueezy'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const subscription = await db.subscription.findUnique({
      where: { userId: user.userId },
    })

    if (!subscription) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 404 }
      )
    }

    const portalUrl = await getCustomerPortalUrl(subscription.lsCustomerId)
    return NextResponse.json({ portalUrl })
  } catch (error) {
    console.error('[SUBSCRIPTIONS_PORTAL_URL]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
