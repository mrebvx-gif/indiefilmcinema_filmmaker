# Phase 2 — Subscription Gate (Lemon Squeezy)

> **Goal:** A logged-in filmmaker who hasn't paid is redirected to `/subscribe`. Paying $6.50/month via Lemon Squeezy activates their account. The middleware enforces the subscription gate on all portal routes. Webhook handles all subscription lifecycle events.
>
> **When this phase is done:** You can log in, be redirected to `/subscribe`, click Subscribe, pay via Lemon Squeezy test mode, be redirected back, and access the dashboard. Cancelling or failing payment correctly updates the subscription status.

---

## What Gets Built in This Phase

**Lib files (fully implemented):**
- `lib/lemonsqueezy.ts` — Checkout URL, portal URL, webhook verification

**API Routes:**
- `GET /api/subscriptions/status`
- `GET /api/subscriptions/checkout-url`
- `GET /api/subscriptions/portal-url`
- `POST /api/webhooks/lemon-squeezy`

**Middleware:**
- `middleware.ts` — Full JWT + subscription gate

**Pages:**
- `/subscribe` — Subscription gate page

---

## Step 2.1 — Implement `lib/lemonsqueezy.ts`

```typescript
import crypto from 'crypto'
import { config } from './config'

const LS_API_BASE = 'https://api.lemonsqueezy.com/v1'

// Helper for authenticated LS API calls
async function lsApiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  return fetch(`${LS_API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${config.lemonSqueezy.apiKey}`,
      Accept: 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json',
      ...options.headers,
    },
  })
}

export async function createCheckoutUrl(
  userId: string,
  email: string,
  fullName: string
): Promise<string> {
  const appUrl = config.app.url

  const response = await lsApiFetch('/checkouts', {
    method: 'POST',
    body: JSON.stringify({
      data: {
        type: 'checkouts',
        attributes: {
          checkout_data: {
            email,
            name: fullName,
            custom: { user_id: userId },
          },
          product_options: {
            redirect_url: `${appUrl}/dashboard?subscription=success`,
            receipt_thank_you_note: 'Welcome to Indie Film Cinema!',
          },
          checkout_options: {
            button_color: '#E63946',
          },
        },
        relationships: {
          store: {
            data: { type: 'stores', id: config.lemonSqueezy.storeId },
          },
          variant: {
            data: { type: 'variants', id: config.lemonSqueezy.variantId },
          },
        },
      },
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Lemon Squeezy checkout creation failed: ${error}`)
  }

  const data = await response.json()
  return data.data.attributes.url as string
}

export async function getCustomerPortalUrl(
  lsCustomerId: string
): Promise<string> {
  const response = await lsApiFetch(
    `/customers/${lsCustomerId}/portal-url`,
    { method: 'GET' }
  )

  if (!response.ok) {
    throw new Error('Failed to get customer portal URL')
  }

  const data = await response.json()
  return data.meta.urls.customer_portal as string
}

export function verifyWebhookSignature(
  rawBody: string,
  signature: string
): boolean {
  try {
    const hmac = crypto.createHmac('sha256', config.lemonSqueezy.webhookSecret)
    const digest = hmac.update(rawBody).digest('hex')
    const digestBuffer = Buffer.from(digest)
    const signatureBuffer = Buffer.from(signature)

    if (digestBuffer.length !== signatureBuffer.length) return false

    // Constant-time comparison — prevents timing attacks
    return crypto.timingSafeEqual(digestBuffer, signatureBuffer)
  } catch {
    return false
  }
}

// Subscription status values
export const SUBSCRIPTION_STATUS = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  PAST_DUE: 'PAST_DUE',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED',
} as const

export type SubscriptionStatus = keyof typeof SUBSCRIPTION_STATUS
```

---

## Step 2.2 — Implement API Routes

### `app/api/subscriptions/status/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

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
```

### `app/api/subscriptions/checkout-url/route.ts`

```typescript
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
```

### `app/api/subscriptions/portal-url/route.ts`

```typescript
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
```

### `app/api/webhooks/lemon-squeezy/route.ts`

This is the most critical route in Phase 2. Read every comment carefully.

```typescript
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
```

---

## Step 2.3 — Implement `middleware.ts`

Replace the stub from Phase 0:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const accessSecret = new TextEncoder().encode(process.env.JWT_SECRET!)

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/submit/:path*',
    '/submissions/:path*',
  ],
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Step 1: Verify JWT from cookie or Authorization header
  const tokenFromCookie = request.cookies.get('access_token')?.value
  const tokenFromHeader = request.headers.get('authorization')?.replace('Bearer ', '')
  const token = tokenFromCookie ?? tokenFromHeader

  if (!token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  let userId: string
  try {
    const { payload } = await jwtVerify(token, accessSecret)
    userId = payload.userId as string
  } catch {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Step 2: Check subscription status
  // Direct DB query in middleware using Supabase REST API (can't import Prisma in Edge runtime)
  // Use fetch to call our own /api/subscriptions/status endpoint
  try {
    const statusUrl = new URL('/api/subscriptions/status', request.url)
    const statusResponse = await fetch(statusUrl, {
      headers: { Authorization: `Bearer ${token}` },
    })

    if (statusResponse.ok) {
      const { isActive } = await statusResponse.json()
      if (!isActive) {
        return NextResponse.redirect(new URL('/subscribe', request.url))
      }
    } else {
      return NextResponse.redirect(new URL('/subscribe', request.url))
    }
  } catch {
    // On error, fail safe: redirect to subscribe
    return NextResponse.redirect(new URL('/subscribe', request.url))
  }

  return NextResponse.next()
}
```

> **Note on middleware + Prisma:** Next.js middleware runs on the Edge Runtime which does not support Node.js native modules (Prisma uses them). The middleware calls `/api/subscriptions/status` via fetch, which runs as a regular serverless function with full Prisma support. This is the correct pattern.

---

## Step 2.4 — `/subscribe` Page

```tsx
// app/subscribe/page.tsx
'use client'
import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { authFetch } from '@/lib/auth-client'

export default function SubscribePage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const searchParams = useSearchParams()
  const cancelled = searchParams.get('cancelled')
  const pastDue = searchParams.get('past_due')

  async function handleSubscribe() {
    setLoading(true)
    setError('')
    try {
      const res = await authFetch('/api/subscriptions/checkout-url')
      if (!res.ok) throw new Error('Failed to get checkout URL')
      const { checkoutUrl } = await res.json()
      window.location.href = checkoutUrl
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  async function handleUpdateBilling() {
    setLoading(true)
    try {
      const res = await authFetch('/api/subscriptions/portal-url')
      if (!res.ok) throw new Error('Failed to get portal URL')
      const { portalUrl } = await res.json()
      window.open(portalUrl, '_blank')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            Filmmaker Access
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {cancelled && (
            <Alert>
              <AlertDescription>
                Subscription cancelled. You can re-subscribe below.
              </AlertDescription>
            </Alert>
          )}
          {pastDue && (
            <Alert variant="destructive">
              <AlertDescription>
                Your payment failed. Please update your billing details.
              </AlertDescription>
            </Alert>
          )}

          <div className="text-center space-y-2">
            <p className="text-4xl font-bold text-accent">$6.50</p>
            <p className="text-muted-foreground">per month</p>
          </div>

          <ul className="space-y-2 text-sm">
            {[
              'Submit unlimited films',
              'Direct upload to BunnyCDN',
              'Full submission history',
              'Cancel anytime',
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="text-accent">✓</span> {item}
              </li>
            ))}
          </ul>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {pastDue ? (
            <Button
              className="w-full"
              onClick={handleUpdateBilling}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Update Billing Details'}
            </Button>
          ) : (
            <Button
              className="w-full"
              onClick={handleSubscribe}
              disabled={loading}
            >
              {loading ? 'Loading...' : 'Subscribe Now — $6.50/mo'}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
```

---

## Step 2.5 — Access Token in Cookie (Middleware Compatibility)

The middleware reads the access token from a cookie (`access_token`). Update the login response to also set this as a non-httpOnly cookie so the middleware can read it:

In `app/api/auth/login/route.ts`, add after setting the refresh token cookie:

```typescript
// Also set access token in a regular cookie for middleware
// (Not httpOnly — middleware needs to read it, but it has a short TTL of 15 min)
response.cookies.set('access_token', accessToken, {
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 60 * 15, // 15 minutes — matches JWT expiry
  path: '/',
})
```

Also update `app/api/auth/refresh/route.ts` to set this cookie on refresh.
Also update `app/api/auth/logout/route.ts` to clear it.

---

## Phase 2 Verification Checklist

- [x] Logging in and visiting `/dashboard` redirects to `/subscribe` when no subscription exists
- [x] Clicking "Subscribe Now" redirects to Lemon Squeezy checkout (in test mode)
- [x] After completing test payment, Lemon Squeezy sends `subscription_created` webhook
- [x] Webhook handler creates a `subscriptions` row with `status = 'ACTIVE'` in the DB
- [x] After payment, redirect back to `/dashboard?subscription=success` works
- [x] Visiting `/dashboard` no longer redirects to `/subscribe` (subscription is active)
- [x] `subscription_payment_failed` webhook → status becomes `PAST_DUE` in DB
- [x] `subscription_cancelled` webhook → status becomes `CANCELLED` in DB
- [x] Welcome email received after subscription activated
- [x] Payment failed email received after `subscription_payment_failed`
- [x] `/api/webhooks/lemon-squeezy` returns 401 when called with invalid/no signature
- [x] `npx tsc --noEmit` passes

---

*Phase 2 complete → Proceed to [Phase 3 — Upload Infrastructure](./04_PHASE_3_UPLOADS.md)*