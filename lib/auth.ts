import { NextRequest } from 'next/server'

export type AuthUser = {
  userId: string
  email: string
  fullName: string
}

// Stub — implemented in Phase 1
export async function getAuthUser(
  _request: NextRequest
): Promise<AuthUser | null> {
  return null
}
