import { SignJWT, jwtVerify } from 'jose'
import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { config } from './config'

export type AuthUser = {
  userId: string
  email: string
  fullName: string
}

const accessSecret = new TextEncoder().encode(config.jwt.secret)
const refreshSecret = new TextEncoder().encode(config.jwt.refreshSecret)

export async function signAccessToken(user: AuthUser): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(config.jwt.accessExpiresIn)
    .sign(accessSecret)
}

export async function signRefreshToken(userId: string): Promise<string> {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(config.jwt.refreshExpiresIn)
    .sign(refreshSecret)
}

export async function verifyAccessToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, accessSecret)
    return payload as unknown as AuthUser
  } catch {
    return null
  }
}

export async function verifyRefreshToken(
  token: string
): Promise<{ userId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, refreshSecret)
    return payload as { userId: string }
  } catch {
    return null
  }
}

// Primary helper used in all protected route handlers
export async function getAuthUser(
  request: NextRequest
): Promise<AuthUser | null> {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '')
  if (!token) return null
  return verifyAccessToken(token)
}

// Cookie helpers for refresh token
export const REFRESH_TOKEN_COOKIE = 'refresh_token'

export async function setRefreshTokenCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set(REFRESH_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })
}

export async function clearRefreshTokenCookie() {
  const cookieStore = await cookies()
  cookieStore.set(REFRESH_TOKEN_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  })
}

export async function getRefreshTokenFromCookies(request: NextRequest): Promise<string | null> {
  return request.cookies.get(REFRESH_TOKEN_COOKIE)?.value ?? null
}
