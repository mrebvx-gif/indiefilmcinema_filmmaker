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
