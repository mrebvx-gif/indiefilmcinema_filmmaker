import { NextRequest, NextResponse } from 'next/server'

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/submit/:path*',
    '/submissions/:path*',
  ],
}

// Stub — implemented fully in Phase 2
export async function proxy(_request: NextRequest) {
  // Phase 2 will add: JWT check + subscription status check
  return NextResponse.next()
}
