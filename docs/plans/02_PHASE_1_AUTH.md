# Phase 1 — Authentication

> **Goal:** A filmmaker can register, verify their email, log in, maintain a session with JWT refresh tokens, and reset their password. All auth API routes are complete. Auth pages exist and are functional.
>
> **When this phase is done:** You can register a new account, receive a verification email, click the link, log in, and see a "logged in" state. You can request a password reset and use the link. All protected routes still redirect to login (subscription gate comes in Phase 2).

---

## What Gets Built in This Phase

**API Routes:**
- `POST /api/auth/register`
- `GET /api/auth/verify-email/[token]`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

**Lib files (fully implemented):**
- `lib/auth.ts` — JWT sign/verify, `getAuthUser` helper
- `lib/email.ts` — Resend integration, all email templates

**Pages:**
- `/register`
- `/login`
- `/verify-email` (landing page for email link)
- `/forgot-password`
- `/reset-password`

---

## Step 1.1 — Implement `lib/auth.ts`

Replace the stub from Phase 0 with the full implementation:

```typescript
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

export function setRefreshTokenCookie(token: string) {
  cookies().set(REFRESH_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })
}

export function clearRefreshTokenCookie() {
  cookies().set(REFRESH_TOKEN_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  })
}

export function getRefreshTokenFromCookies(request: NextRequest): string | null {
  return request.cookies.get(REFRESH_TOKEN_COOKIE)?.value ?? null
}
```

---

## Step 1.2 — Implement `lib/email.ts`

Replace the stub with full Resend implementation:

```typescript
import { Resend } from 'resend'
import { config } from './config'

const resend = new Resend(config.resend.apiKey)
const FROM = config.resend.from
const APP_URL = config.app.url

export async function sendVerificationEmail(
  email: string,
  token: string
): Promise<void> {
  const verifyUrl = `${APP_URL}/verify-email?token=${token}`
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Verify your Indie Film Cinema account',
    html: `
      <h2>Verify your email</h2>
      <p>Click the link below to activate your Indie Film Cinema filmmaker account:</p>
      <a href="${verifyUrl}" style="background:#E63946;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">
        Verify Email
      </a>
      <p>This link expires in 24 hours.</p>
      <p>If you did not create an account, you can ignore this email.</p>
    `,
  })
}

export async function sendPasswordResetEmail(
  email: string,
  token: string
): Promise<void> {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Reset your Indie Film Cinema password',
    html: `
      <h2>Reset your password</h2>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}" style="background:#E63946;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">
        Reset Password
      </a>
      <p>This link expires in 1 hour.</p>
      <p>If you did not request a password reset, you can safely ignore this email.</p>
    `,
  })
}

export async function sendWelcomeEmail(
  email: string,
  fullName: string
): Promise<void> {
  const dashboardUrl = `${APP_URL}/dashboard`
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Welcome — your Indie Film Cinema account is active',
    html: `
      <h2>Welcome, ${fullName}!</h2>
      <p>Your $6.50/month subscription is now active. You can start submitting your films.</p>
      <a href="${dashboardUrl}" style="background:#E63946;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">
        Go to Dashboard
      </a>
    `,
  })
}

export async function sendPaymentFailedEmail(
  email: string,
  fullName: string
): Promise<void> {
  const subscribeUrl = `${APP_URL}/subscribe`
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Action required: payment failed for your subscription',
    html: `
      <h2>Hi ${fullName},</h2>
      <p>Your monthly payment for Indie Film Cinema failed. Your upload access has been paused.</p>
      <p>Please update your billing details to restore access:</p>
      <a href="${subscribeUrl}" style="background:#E63946;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">
        Update Billing
      </a>
    `,
  })
}

export async function sendSubscriptionCancelledEmail(
  email: string,
  fullName: string
): Promise<void> {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Your Indie Film Cinema subscription has been cancelled',
    html: `
      <h2>Hi ${fullName},</h2>
      <p>Your subscription has been cancelled. Your access will continue until the end of your current billing period.</p>
      <p>You can resubscribe at any time from your account settings.</p>
    `,
  })
}

export async function sendSubmissionConfirmationEmail(
  email: string,
  fullName: string,
  filmTitle: string
): Promise<void> {
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: `Film received: ${filmTitle}`,
    html: `
      <h2>Hi ${fullName},</h2>
      <p>We've received your film submission: <strong>${filmTitle}</strong>.</p>
      <p>Our team will review your submission and publish it to the platform. No further action is required from you.</p>
      <p>You can view your submission status in your <a href="${config.app.url}/dashboard">dashboard</a>.</p>
    `,
  })
}
```

---

## Step 1.3 — Implement API Routes

### `app/api/auth/register/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/password'
import { sendVerificationEmail } from '@/lib/email'
import { RegisterSchema } from '@/lib/validations/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = RegisterSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      )
    }

    const { fullName, email, password } = result.data

    // Check duplicate email
    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    const passwordHash = await hashPassword(password)

    // Create user
    const user = await db.user.create({
      data: { fullName, email, passwordHash },
    })

    // Create verification token (expires 24h)
    const token = crypto.randomBytes(32).toString('hex')
    await db.emailVerificationToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    })

    // Send email (don't await — don't fail registration if email fails)
    sendVerificationEmail(email, token).catch(console.error)

    return NextResponse.json(
      { message: 'Account created. Please check your email to verify your account.' },
      { status: 201 }
    )
  } catch (error) {
    console.error('[AUTH_REGISTER]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

### `app/api/auth/verify-email/[token]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { config } from '@/lib/config'

export async function GET(
  _request: NextRequest,
  { params }: { params: { token: string } }
) {
  const { token } = params
  const appUrl = config.app.url

  try {
    const record = await db.emailVerificationToken.findUnique({
      where: { token },
    })

    if (!record) {
      return NextResponse.redirect(`${appUrl}/verify-email?error=invalid`)
    }
    if (record.usedAt) {
      return NextResponse.redirect(`${appUrl}/verify-email?error=used`)
    }
    if (record.expiresAt < new Date()) {
      return NextResponse.redirect(`${appUrl}/verify-email?error=expired`)
    }

    // Mark verified
    await db.$transaction([
      db.user.update({
        where: { id: record.userId },
        data: { isEmailVerified: true },
      }),
      db.emailVerificationToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ])

    return NextResponse.redirect(`${appUrl}/login?verified=true`)
  } catch (error) {
    console.error('[AUTH_VERIFY_EMAIL]', error)
    return NextResponse.redirect(`${appUrl}/verify-email?error=server`)
  }
}
```

### `app/api/auth/login/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword } from '@/lib/password'
import {
  signAccessToken,
  signRefreshToken,
  setRefreshTokenCookie,
} from '@/lib/auth'
import { LoginSchema } from '@/lib/validations/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = LoginSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const { email, password } = result.data
    const user = await db.user.findUnique({ where: { email } })

    // Generic error — don't reveal whether email exists
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    if (!user.isEmailVerified) {
      return NextResponse.json(
        { error: 'Please verify your email before logging in', code: 'EMAIL_NOT_VERIFIED' },
        { status: 403 }
      )
    }

    if (user.isSuspended) {
      return NextResponse.json(
        { error: 'Your account has been suspended' },
        { status: 403 }
      )
    }

    const authUser = { userId: user.id, email: user.email, fullName: user.fullName }
    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken(authUser),
      signRefreshToken(user.id),
    ])

    const response = NextResponse.json({
      accessToken,
      user: { id: user.id, email: user.email, fullName: user.fullName },
    })

    // Set refresh token as HTTP-only cookie on the response
    response.cookies.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('[AUTH_LOGIN]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

### `app/api/auth/refresh/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  verifyRefreshToken,
  signAccessToken,
  signRefreshToken,
} from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('refresh_token')?.value
    if (!refreshToken) {
      return NextResponse.json({ error: 'No refresh token' }, { status: 401 })
    }

    const payload = await verifyRefreshToken(refreshToken)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid refresh token' }, { status: 401 })
    }

    const user = await db.user.findUnique({ where: { id: payload.userId } })
    if (!user || user.isSuspended) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const authUser = { userId: user.id, email: user.email, fullName: user.fullName }
    const [newAccessToken, newRefreshToken] = await Promise.all([
      signAccessToken(authUser),
      signRefreshToken(user.id),
    ])

    const response = NextResponse.json({ accessToken: newAccessToken })
    response.cookies.set('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('[AUTH_REFRESH]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

### `app/api/auth/logout/route.ts`

```typescript
import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ message: 'Logged out' })
  response.cookies.set('refresh_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  })
  return response
}
```

### `app/api/auth/forgot-password/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { db } from '@/lib/db'
import { sendPasswordResetEmail } from '@/lib/email'
import { ForgotPasswordSchema } from '@/lib/validations/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = ForgotPasswordSchema.safeParse(body)
    if (!result.success) {
      // Always return 200 — no user enumeration
      return NextResponse.json({ message: 'If that email exists, a reset link was sent.' })
    }

    const { email } = result.data
    const user = await db.user.findUnique({ where: { email } })

    if (user) {
      const token = crypto.randomBytes(32).toString('hex')
      await db.passwordResetToken.create({
        data: {
          userId: user.id,
          token,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        },
      })
      sendPasswordResetEmail(email, token).catch(console.error)
    }

    return NextResponse.json({ message: 'If that email exists, a reset link was sent.' })
  } catch (error) {
    console.error('[AUTH_FORGOT_PASSWORD]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

### `app/api/auth/reset-password/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/password'
import { ResetPasswordSchema } from '@/lib/validations/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = ResetPasswordSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      )
    }

    const { token, newPassword } = result.data
    const record = await db.passwordResetToken.findUnique({ where: { token } })

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'This reset link is invalid or has expired.' },
        { status: 400 }
      )
    }

    const newHash = await hashPassword(newPassword)

    await db.$transaction([
      db.user.update({
        where: { id: record.userId },
        data: { passwordHash: newHash },
      }),
      db.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ])

    return NextResponse.json({ message: 'Password updated successfully.' })
  } catch (error) {
    console.error('[AUTH_RESET_PASSWORD]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

---

## Step 1.4 — Auth Pages

Build these pages with a clean, dark-themed UI using shadcn components. All forms use controlled inputs and call the API routes above via `fetch`.

### Client-side auth state

Create `lib/auth-client.ts` for browser-side auth utilities:

```typescript
// lib/auth-client.ts
// Stores access token in memory (not localStorage — XSS protection)
let accessToken: string | null = null

export function setAccessToken(token: string) {
  accessToken = token
}

export function getAccessToken(): string | null {
  return accessToken
}

export function clearAccessToken() {
  accessToken = null
}

// Authenticated fetch wrapper
export async function authFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  if (!accessToken) {
    // Try to refresh
    const refreshResponse = await fetch('/api/auth/refresh', { method: 'POST' })
    if (refreshResponse.ok) {
      const data = await refreshResponse.json()
      accessToken = data.accessToken
    }
  }

  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: accessToken ? `Bearer ${accessToken}` : '',
      'Content-Type': 'application/json',
    },
  })
}
```

### Page: `app/(auth)/register/page.tsx`

Build a dark-themed register form with:
- Full Name input
- Email input
- Password input (with show/hide toggle)
- Confirm Password input (client-side match validation)
- Submit button (shows loading spinner while submitting)
- On success: show "Check your email" message — do NOT redirect to login yet
- Link to `/login` at the bottom

### Page: `app/(auth)/login/page.tsx`

Build a dark-themed login form with:
- Email input
- Password input
- Submit button with loading state
- Show inline error on 401 ("Invalid email or password")
- Show "Please verify your email" message if response has `code: 'EMAIL_NOT_VERIFIED'`
- Show success message if query param `?verified=true` is present ("Email verified! You can now log in.")
- On success: store `accessToken` via `setAccessToken()`, then redirect to `/dashboard`
- "Forgot password?" link to `/forgot-password`
- Link to `/register`

### Page: `app/(auth)/verify-email/page.tsx`

This page reads the `?token` query param and calls the API route, OR it receives an `?error` or `?success` redirect from the API route.

Display states:
- Loading: "Verifying your email..."
- `?error=invalid`: "This verification link is invalid."
- `?error=expired`: "This link has expired. Please register again."
- `?error=used`: "This link has already been used."
- `?error=server`: "Something went wrong. Please try again."
- (success redirect goes to `/login?verified=true` — handled on login page)

### Page: `app/(auth)/forgot-password/page.tsx`

Simple email form. On submit, always show: "If that email address is registered, you'll receive a reset link shortly." No error state that reveals whether email exists.

### Page: `app/(auth)/reset-password/page.tsx`

Reads `?token` from query params. Shows new password + confirm password form. On success, redirect to `/login` with a success message. On expired/invalid token error, show clear message.

---

## Step 1.5 — Temporary Dashboard Stub

Create a stub so login redirect works:

```tsx
// app/(portal)/dashboard/page.tsx
export default function DashboardPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Phase 2 will add subscription gate. Phase 5 will build this page.
        </p>
      </div>
    </div>
  )
}
```

---

## Phase 1 Verification Checklist

- [ ] `POST /api/auth/register` with valid data creates a user in the DB and sends a verification email
- [ ] `POST /api/auth/register` with duplicate email returns 409
- [ ] `POST /api/auth/register` with weak password returns 400 with validation details
- [ ] Clicking the verification link in the email sets `is_email_verified = true` in the DB and redirects to `/login?verified=true`
- [ ] `POST /api/auth/login` with unverified email returns 403 with `code: EMAIL_NOT_VERIFIED`
- [ ] `POST /api/auth/login` with correct credentials returns `accessToken` and sets `refresh_token` cookie
- [ ] `POST /api/auth/login` with wrong password returns generic 401
- [ ] `POST /api/auth/refresh` with valid cookie returns new `accessToken`
- [ ] `POST /api/auth/logout` clears the cookie
- [ ] `POST /api/auth/forgot-password` always returns 200 regardless of email existence
- [ ] `POST /api/auth/reset-password` with valid token updates the password
- [ ] `POST /api/auth/reset-password` with expired/used token returns 400
- [ ] Register page → shows "Check your email" on success
- [ ] Login page → shows `/login?verified=true` banner when landing from verification
- [ ] Login page → redirects to `/dashboard` on success
- [ ] `npx tsc --noEmit` passes

---

*Phase 1 complete → Proceed to [Phase 2 — Subscription Gate](./03_PHASE_2_SUBSCRIPTION.md)*