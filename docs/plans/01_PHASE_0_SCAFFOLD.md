# Phase 0 — Project Scaffold & Configuration

> **Goal:** A running Next.js 14 app connected to Supabase, all dependencies installed, folder structure created, Prisma schema migrated, and a health-check route returning 200. Nothing is built yet — this phase is purely infrastructure.
>
> **When this phase is done:** `npm run dev` runs without errors. `GET /api/health` returns `{ ok: true }`. Prisma Studio shows all 5 empty tables.

---

## Step 0.1 — Bootstrap Next.js Project

Run this exact command. Do not modify the options:

```bash
npx create-next-app@latest indie-film-portal \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir=false \
  --import-alias="@/*"

cd indie-film-portal
```

---

## Step 0.2 — Install All Dependencies

Install everything upfront so no phase has missing packages:

```bash
# Core dependencies
npm install \
  prisma \
  @prisma/client \
  zod \
  bcryptjs \
  jsonwebtoken \
  resend \
  @lemonsqueezy/lemonsqueezy-js \
  cookie \
  jose

# Dev dependencies
npm install -D \
  @types/bcryptjs \
  @types/jsonwebtoken \
  @types/cookie \
  prisma

# shadcn/ui — initialise
npx shadcn-ui@latest init
# When prompted:
#   Style: Default
#   Base color: Slate
#   CSS variables: Yes

# Install shadcn components used in this project
npx shadcn-ui@latest add button input label form card badge separator toast progress alert
```

---

## Step 0.3 — Prisma Setup

```bash
npx prisma init
```

Replace the contents of `prisma/schema.prisma` with the complete schema from the Master Index (`00_MASTER_INDEX.md` → "Complete Prisma Schema" section). Copy it exactly.

Then create the initial migration:

```bash
npx prisma migrate dev --name init
```

This will create all 5 tables in your Supabase database.

Verify:

```bash
npx prisma studio
# Opens at http://localhost:5555
# You should see: users, subscriptions, email_verification_tokens,
# password_reset_tokens, film_submissions — all empty
```

---

## Step 0.4 — Create All Required Files

Create every file listed below. Content is specified for each.

### `/lib/config.ts`

```typescript
export const config = {
  jwt: {
    secret: process.env.JWT_SECRET!,
    refreshSecret: process.env.JWT_REFRESH_SECRET!,
    accessExpiresIn: '15m',
    refreshExpiresIn: '7d',
  },
  bunny: {
    apiKey: process.env.BUNNY_API_KEY!,
    streamLibraryId: process.env.BUNNY_STREAM_LIBRARY_ID!,
    streamAccessKey: process.env.BUNNY_STREAM_ACCESS_KEY!,
    storageZoneName: process.env.BUNNY_STORAGE_ZONE_NAME!,
    storageAccessKey: process.env.BUNNY_STORAGE_ACCESS_KEY!,
    storageCdnUrl: process.env.BUNNY_STORAGE_CDN_URL!,
  },
  lemonSqueezy: {
    apiKey: process.env.LEMON_SQUEEZY_API_KEY!,
    storeId: process.env.LEMON_SQUEEZY_STORE_ID!,
    variantId: process.env.LEMON_SQUEEZY_VARIANT_ID!,
    webhookSecret: process.env.LS_WEBHOOK_SECRET!,
  },
  resend: {
    apiKey: process.env.RESEND_API_KEY!,
    from: process.env.EMAIL_FROM!,
  },
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL!,
  },
}
```

### `/lib/db.ts`

Prisma client singleton — prevents connection exhaustion in serverless (critical for Vercel):

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
```

### `/lib/password.ts`

```typescript
import bcrypt from 'bcryptjs'

const SALT_ROUNDS = 12

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}
```

### `/lib/auth.ts`

Stub — Phase 1 will fill in the full implementation:

```typescript
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
```

### `/lib/email.ts`

Stub — Phase 1 will fill in the full implementation:

```typescript
// Stub — implemented in Phase 1
export async function sendVerificationEmail(
  _email: string,
  _token: string
): Promise<void> {}

export async function sendPasswordResetEmail(
  _email: string,
  _token: string
): Promise<void> {}

export async function sendWelcomeEmail(
  _email: string,
  _fullName: string
): Promise<void> {}

export async function sendPaymentFailedEmail(
  _email: string,
  _fullName: string
): Promise<void> {}

export async function sendSubscriptionCancelledEmail(
  _email: string,
  _fullName: string
): Promise<void> {}

export async function sendSubmissionConfirmationEmail(
  _email: string,
  _fullName: string,
  _filmTitle: string
): Promise<void> {}
```

### `/lib/bunny.ts`

Stub — Phase 3 will fill in the full implementation:

```typescript
// Stub — implemented in Phase 3
export async function generateVideoUploadUrl(
  _filename: string
): Promise<{ bunnyVideoId: string; uploadUrl: string }> {
  throw new Error('Not implemented')
}

export async function generateImageUploadUrl(
  _filename: string,
  _userId: string,
  _purpose: 'poster' | 'thumbnail'
): Promise<{ objectName: string; uploadUrl: string; publicUrl: string }> {
  throw new Error('Not implemented')
}

export async function confirmVideoUpload(
  _bunnyVideoId: string
): Promise<{ confirmed: boolean; reason?: string }> {
  throw new Error('Not implemented')
}
```

### `/lib/lemonsqueezy.ts`

Stub — Phase 2 will fill in the full implementation:

```typescript
// Stub — implemented in Phase 2
export async function createCheckoutUrl(
  _userId: string,
  _email: string,
  _fullName: string
): Promise<string> {
  throw new Error('Not implemented')
}

export async function getCustomerPortalUrl(
  _lsCustomerId: string
): Promise<string> {
  throw new Error('Not implemented')
}

export function verifyWebhookSignature(
  _rawBody: string,
  _signature: string
): boolean {
  return false
}
```

### `/lib/validations/auth.ts`

```typescript
import { z } from 'zod'

export const RegisterSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(255),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100),
})

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const ForgotPasswordSchema = z.object({
  email: z.string().email(),
})

export const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8).max(100),
})

export type RegisterInput = z.infer<typeof RegisterSchema>
export type LoginInput = z.infer<typeof LoginSchema>
```

### `/lib/validations/films.ts`

```typescript
import { z } from 'zod'

const GENRES = [
  'Horror', 'Drama', 'Documentary', 'Comedy', 'Thriller',
  'Action', 'Sci-Fi', 'Romance', 'Animation', 'Music Video',
  'Short Film', 'Other',
] as const

const MARKET_INTERESTS = [
  'FESTIVAL_LOCAL',
  'FESTIVAL_INTERNATIONAL',
  'THEATRICAL',
  'STREAMING_VOD',
  'EDUCATIONAL',
] as const

export const FilmSubmissionSchema = z.object({
  filmTitle: z.string().min(1).max(500),
  logline: z.string().min(20, 'Logline must be at least 20 characters').max(1000),
  runningTimeSeconds: z.number().int().min(1, 'Running time is required'),
  primaryGenre: z.enum(GENRES),
  countryOfOrigin: z.string().min(1).max(100),
  targetCountries: z.array(z.string()).default([]),
  targetReleaseYear: z.number().int().min(2024).max(2035).optional().nullable(),
  directorName: z.string().min(1).max(255),
  producerName: z.string().max(255).optional().nullable(),
  writerName: z.string().max(255).optional().nullable(),
  cinematographerName: z.string().max(255).optional().nullable(),
  marketInterests: z.array(z.enum(MARKET_INTERESTS)).default([]),
  narrativeScale: z.number().int().min(1).max(7),
  posterBunnyUrl: z.string().url().optional().nullable(),
  posterBunnyObject: z.string().optional().nullable(),
  thumbnailBunnyUrl: z.string().url('Thumbnail is required'),
  thumbnailBunnyObject: z.string().min(1),
  youtubeTrailerUrl: z.string().refine(
    (url) => /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/.test(url),
    { message: 'Must be a valid YouTube URL' }
  ),
  videoBunnyVideoId: z.string().min(1, 'Video upload is required'),
  videoBunnyLibraryId: z.string().min(1),
})

export type FilmSubmissionInput = z.infer<typeof FilmSubmissionSchema>
export { GENRES, MARKET_INTERESTS }
```

### `/lib/validations/uploads.ts`

```typescript
import { z } from 'zod'

export const VideoUploadUrlSchema = z.object({
  filename: z.string().min(1).max(255),
  fileSizeBytes: z.number().int().positive(),
})

export const ImageUploadUrlSchema = z.object({
  filename: z.string().min(1).max(255),
  fileSizeBytes: z.number().int().positive().max(10 * 1024 * 1024, 'Max 10MB'),
  purpose: z.enum(['poster', 'thumbnail']),
})

export const ConfirmVideoSchema = z.object({
  bunnyVideoId: z.string().min(1),
})
```

### `/middleware.ts`

Stub — Phase 2 will fill in the full subscription gate logic:

```typescript
import { NextRequest, NextResponse } from 'next/server'

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/submit/:path*',
    '/submissions/:path*',
  ],
}

// Stub — implemented fully in Phase 2
export async function middleware(_request: NextRequest) {
  // Phase 2 will add: JWT check + subscription status check
  return NextResponse.next()
}
```

### `/app/api/health/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    // Verify DB connection
    await db.$queryRaw`SELECT 1`
    return NextResponse.json({ ok: true, db: 'connected' })
  } catch (error) {
    return NextResponse.json({ ok: false, db: 'error' }, { status: 500 })
  }
}
```

### `/.env.example`

```bash
# Database (Supabase)
DATABASE_URL=""
DIRECT_URL=""

# Auth
JWT_SECRET=""
JWT_REFRESH_SECRET=""

# Lemon Squeezy
LEMON_SQUEEZY_API_KEY=""
LEMON_SQUEEZY_STORE_ID=""
LEMON_SQUEEZY_VARIANT_ID=""
LS_WEBHOOK_SECRET=""

# BunnyCDN
BUNNY_API_KEY=""
BUNNY_STREAM_LIBRARY_ID=""
BUNNY_STREAM_ACCESS_KEY=""
BUNNY_STORAGE_ZONE_NAME=""
BUNNY_STORAGE_ACCESS_KEY=""
BUNNY_STORAGE_CDN_URL=""

# Email (Resend)
RESEND_API_KEY=""
EMAIL_FROM=""

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### `/.gitignore` additions

Ensure these lines exist in `.gitignore`:

```
.env.local
.env
```

---

## Step 0.5 — Configure Tailwind for Dark Theme

The portal uses a dark, cinematic theme. Add this to `tailwind.config.ts`:

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#0D1B2A',
          light: '#1D3557',
        },
        accent: {
          DEFAULT: '#E63946',
          hover: '#c1121f',
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
export default config
```

Replace `app/globals.css` with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 222 47% 8%;
    --foreground: 210 40% 96%;
    --card: 222 47% 10%;
    --card-foreground: 210 40% 96%;
    --border: 217 33% 20%;
    --input: 217 33% 15%;
    --primary: 355 77% 57%;
    --primary-foreground: 0 0% 100%;
    --muted: 217 33% 17%;
    --muted-foreground: 215 20% 65%;
    --radius: 0.5rem;
  }
}

* {
  border-color: hsl(var(--border));
}

body {
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
}
```

---

## Step 0.6 — Root Layout

Replace `app/layout.tsx`:

```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Indie Film Cinema — Filmmaker Portal',
  description: 'Submit your film to Indie Film Cinema',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
```

---

## Phase 0 Verification Checklist

Before moving to Phase 1, confirm ALL of the following:

- [ ] `npm run dev` starts without errors on `http://localhost:3000`
- [ ] `GET http://localhost:3000/api/health` returns `{ "ok": true, "db": "connected" }`
- [ ] `npx prisma studio` shows 5 tables: `users`, `subscriptions`, `email_verification_tokens`, `password_reset_tokens`, `film_submissions`
- [ ] `npx tsc --noEmit` passes with no errors
- [ ] All files in the folder structure from the Master Index exist (even if stubs)
- [ ] `.env.local` exists and is git-ignored
- [ ] `.env.example` is committed with empty values

---

*Phase 0 complete → Proceed to [Phase 1 — Authentication](./02_PHASE_1_AUTH.md)*