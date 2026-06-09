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

  // Step 2: Check subscription status
  // Direct DB query in proxy using fetch to call our own /api/subscriptions/status endpoint
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
