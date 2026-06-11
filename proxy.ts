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

export async function proxy(request: NextRequest) {
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

  // Step 2: Check subscription status (Hybrid Cookie/Fetch Architecture)
  const isSubscriptionActive = request.cookies.get('auth_subscription_active')?.value === 'true'

  if (isSubscriptionActive) {
    // Fast path: bypass network fetch entirely
    return NextResponse.next()
  }

  // Fallback: Fetch from database dynamically via Edge origin
  try {
    const { origin } = request.nextUrl
    const statusUrl = `${origin}/api/subscriptions/status`
    const statusResponse = await fetch(statusUrl, {
      method: 'GET',
      headers: { 
        Authorization: `Bearer ${token}`,
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
      cache: 'no-store',
    })

    if (statusResponse.ok) {
      const { isActive } = await statusResponse.json()
      if (isActive) {
        // 1. Create the pass-through response
        const response = NextResponse.next()

        // 2. Attach the secure cookie to the outgoing response to upgrade them to the fast-path
        response.cookies.set('auth_subscription_active', 'true', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 7, // 1 week
        })

        // 3. Return the response to let them into the dashboard
        return response
      }
    }
    
    // Inactive or response not ok -> redirect to subscribe with aggressive cache-busting
    const redirectUrl = new URL('/subscribe', request.url)
    const redirectRes = NextResponse.redirect(redirectUrl)
    redirectRes.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    redirectRes.headers.set('Expires', '0')
    redirectRes.headers.set('Surrogate-Control', 'no-store')
    return redirectRes

  } catch (error) {
    console.error('Middleware fetch failed:', error)
    // On error, fail safe: redirect to subscribe with cache-busting
    const redirectUrl = new URL('/subscribe', request.url)
    const redirectRes = NextResponse.redirect(redirectUrl)
    redirectRes.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    redirectRes.headers.set('Expires', '0')
    redirectRes.headers.set('Surrogate-Control', 'no-store')
    return redirectRes
  }
}
