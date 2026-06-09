import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyWebhookSignature } from '@/lib/lemonsqueezy'
import {
  sendWelcomeEmail,
  sendPaymentFailedEmail,
  sendSubscriptionCancelledEmail,
} from '@/lib/email'

export async function POST(request: NextRequest) {
  // CRITICAL: Read raw body as text BEFORE json() — needed for signature verification
  const rawBody = await request.text()
  const signature = request.headers.get('x-signature') ?? ''

  // Step 1: Verify signature — reject immediately if invalid
  if (!verifyWebhookSignature(rawBody, signature)) {
    console.warn('[LS_WEBHOOK] Invalid signature from', request.headers.get('x-forwarded-for'))
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // Step 2: Return 200 immediately — Lemon Squeezy expects fast response
  // Process asynchronously to avoid timeout
  const payload = JSON.parse(rawBody)
  const eventName: string = payload.meta?.event_name ?? ''
  const data = payload.data?.attributes ?? {}
  const customData = payload.meta?.custom_data ?? {}
  const lsSubscriptionId = String(payload.data?.id ?? '')

  // Process event asynchronously (don't await)
  handleWebhookEvent(eventName, data, customData, lsSubscriptionId).catch(
    (err) => console.error('[LS_WEBHOOK_HANDLER]', err)
  )

  return NextResponse.json({ received: true })
}

async function handleWebhookEvent(
  eventName: string,
  data: Record<string, unknown>,
  customData: Record<string, unknown>,
  lsSubscriptionId: string
) {
  switch (eventName) {
    case 'subscription_created': {
      const userId = customData.user_id as string
      if (!userId) {
        console.error('[LS_WEBHOOK] subscription_created missing user_id')
        return
      }

      // Idempotency: upsert — safe to run multiple times
      await db.subscription.upsert({
        where: { lsSubscriptionId },
        create: {
          userId,
          lsSubscriptionId,
          lsCustomerId: String(data.customer_id ?? ''),
          lsVariantId: String(data.variant_id ?? ''),
          status: 'ACTIVE',
          currentPeriodEnd: data.renews_at
            ? new Date(data.renews_at as string)
            : null,
        },
        update: {
          status: 'ACTIVE',
          currentPeriodEnd: data.renews_at
            ? new Date(data.renews_at as string)
            : null,
        },
      })

      // Send welcome email
      const user = await db.user.findUnique({ where: { id: userId } })
      if (user) {
        await sendWelcomeEmail(user.email, user.fullName)
      }
      break
    }

    case 'subscription_updated':
    case 'subscription_payment_success': {
      await db.subscription.update({
        where: { lsSubscriptionId },
        data: {
          status: 'ACTIVE',
          currentPeriodEnd: data.renews_at
            ? new Date(data.renews_at as string)
            : undefined,
        },
      })
      break
    }

    case 'subscription_payment_failed': {
      const sub = await db.subscription.update({
        where: { lsSubscriptionId },
        data: { status: 'PAST_DUE' },
        include: { user: true },
      })
      await sendPaymentFailedEmail(sub.user.email, sub.user.fullName)
      break
    }

    case 'subscription_cancelled': {
      const sub = await db.subscription.update({
        where: { lsSubscriptionId },
        data: { status: 'CANCELLED', cancelledAt: new Date() },
        include: { user: true },
      })
      await sendSubscriptionCancelledEmail(sub.user.email, sub.user.fullName)
      break
    }

    case 'subscription_expired': {
      await db.subscription.update({
        where: { lsSubscriptionId },
        data: { status: 'EXPIRED' },
      })
      break
    }

    default:
      // Unknown event — log and ignore
      console.log('[LS_WEBHOOK] Unhandled event:', eventName)
  }
}
