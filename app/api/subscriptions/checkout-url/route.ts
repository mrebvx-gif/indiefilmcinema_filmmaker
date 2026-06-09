import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { createCheckoutUrl } from '@/lib/lemonsqueezy'

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const checkoutUrl = await createCheckoutUrl(
      user.userId,
      user.email,
      user.fullName
    )

    return NextResponse.json({ checkoutUrl })
  } catch (error) {
    console.error('[SUBSCRIPTIONS_CHECKOUT_URL]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
