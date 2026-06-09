# Indie Film Cinema — Filmmaker Admin Panel
## Master Implementation Index

> **For the agentic IDE:** Read this file first before starting any phase. It defines the full project context, conventions, and the exact order of implementation. Each phase has its own detailed file. Work through them sequentially — do not skip phases.

---

## Project Summary

A subscription-gated filmmaker portal where independent filmmakers:
1. Register and verify their email
2. Pay $6.50/month via Lemon Squeezy to unlock the portal
3. Fill a detailed film submission form and upload their video directly to BunnyCDN
4. View their submission history (read-only — submissions are final)

**There is no public viewer site in this build.** This is a private portal only.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router, TypeScript) |
| Database | Supabase (PostgreSQL 15) |
| ORM | Prisma |
| Auth | Custom JWT (no NextAuth) |
| Payments | Lemon Squeezy |
| Video Storage | BunnyCDN Stream |
| Image Storage | BunnyCDN Storage |
| Email | Resend |
| Hosting | Vercel |
| Styling | Tailwind CSS |
| Validation | Zod |
| UI Components | shadcn/ui |

---

## Phase Sequence

| Phase | Name | What it produces | Estimated time |
|---|---|---|---|
| [Phase 0](./01_PHASE_0_SCAFFOLD.md) | Project Scaffold | Running Next.js app, DB connected, all config in place | 0.5 day |
| [Phase 1](./02_PHASE_1_AUTH.md) | Authentication | Register, email verify, login, sessions, password reset | 1.5 days |
| [Phase 2](./03_PHASE_2_SUBSCRIPTION.md) | Subscription Gate | Lemon Squeezy checkout, webhook, portal access control | 1 day |
| [Phase 3](./04_PHASE_3_UPLOADS.md) | Upload Infrastructure | BunnyCDN signed URLs for video and images | 1 day |
| [Phase 4](./05_PHASE_4_SUBMISSION.md) | Film Submission Form | Full multi-section form, all fields, upload widgets | 2 days |
| [Phase 5](./06_PHASE_5_DASHBOARD.md) | Dashboard & History | Filmmaker dashboard, submission list, detail view | 1 day |
| [Phase 6](./07_PHASE_6_POLISH.md) | Polish & Deploy | Security hardening, error handling, Vercel deploy | 1 day |

**Total: ~8 days of focused solo development**

---

## Absolute Rules (Never Violate These)

1. **Submissions are immutable.** No PUT or DELETE endpoint for `/api/films`. Ever.
2. **Never handle file bytes in API routes.** Video and image files go directly from browser to BunnyCDN via signed URLs. API routes only generate URLs.
3. **All secrets in environment variables.** Never hardcode API keys. Never commit `.env` to Git.
4. **Validate every API input with Zod.** No unvalidated user input reaches the database.
5. **Verify Lemon Squeezy webhook signature before processing.** Use `crypto.timingSafeEqual`. Reject without processing on mismatch.
6. **Prisma parameterized queries only.** Never build SQL strings with user input.
7. **Subscription check in middleware.** Every `/dashboard`, `/submit`, `/submissions/*` request must pass through the subscription gate in `middleware.ts`.

---

## Project Folder Structure

```
/
├── app/
│   ├── (auth)/                    # Auth pages (no layout chrome)
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── verify-email/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── reset-password/page.tsx
│   ├── (portal)/                  # Subscription-gated pages
│   │   ├── layout.tsx             # Portal layout with nav
│   │   ├── dashboard/page.tsx
│   │   ├── submit/
│   │   │   ├── page.tsx
│   │   │   └── success/page.tsx
│   │   └── submissions/
│   │       └── [id]/page.tsx
│   ├── subscribe/page.tsx         # Subscription gate page
│   ├── api/
│   │   ├── auth/
│   │   │   ├── register/route.ts
│   │   │   ├── login/route.ts
│   │   │   ├── logout/route.ts
│   │   │   ├── refresh/route.ts
│   │   │   ├── verify-email/[token]/route.ts
│   │   │   ├── forgot-password/route.ts
│   │   │   └── reset-password/route.ts
│   │   ├── subscriptions/
│   │   │   ├── status/route.ts
│   │   │   ├── checkout-url/route.ts
│   │   │   └── portal-url/route.ts
│   │   ├── films/
│   │   │   ├── route.ts           # GET list, POST create
│   │   │   └── [id]/route.ts      # GET single
│   │   ├── uploads/
│   │   │   ├── video-url/route.ts
│   │   │   ├── image-url/route.ts
│   │   │   └── confirm-video/route.ts
│   │   └── webhooks/
│   │       └── lemon-squeezy/route.ts
│   ├── layout.tsx                 # Root layout
│   └── globals.css
├── lib/
│   ├── db.ts                      # Prisma client singleton
│   ├── auth.ts                    # JWT sign/verify, getAuthUser helper
│   ├── bunny.ts                   # BunnyCDN API helpers
│   ├── lemonsqueezy.ts            # LS API helpers
│   ├── email.ts                   # Resend email dispatch
│   ├── password.ts                # bcrypt hash/verify
│   └── validations/
│       ├── auth.ts                # Zod schemas for auth endpoints
│       ├── films.ts               # Zod schema for film submission
│       └── uploads.ts             # Zod schemas for upload endpoints
├── components/
│   ├── ui/                        # shadcn/ui components
│   ├── auth/                      # Auth form components
│   ├── portal/                    # Portal-specific components
│   └── upload/                    # File upload widget components
├── middleware.ts                  # JWT + subscription gate
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── .env.example
└── .env.local                     # Git-ignored
```

---

## Code Patterns (Follow These in Every Phase)

### Pattern 1: API Route Structure
Every API route file follows this exact structure:

```typescript
// app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAuthUser } from '@/lib/auth'
import { db } from '@/lib/db'

const RequestSchema = z.object({
  field: z.string().min(1).max(255),
})

export async function POST(request: NextRequest) {
  try {
    // 1. Auth check (if required)
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse and validate body
    const body = await request.json()
    const result = RequestSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      )
    }
    const data = result.data

    // 3. Business logic (call lib/ helpers, db queries)
    // ...

    // 4. Return response
    return NextResponse.json({ success: true, data: {} }, { status: 200 })

  } catch (error) {
    console.error('[ROUTE_NAME]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

### Pattern 2: Auth Helper
`lib/auth.ts` exposes one main helper used everywhere:

```typescript
// Returns the decoded user payload or null
export async function getAuthUser(request: NextRequest): Promise<AuthUser | null>

// Type
type AuthUser = {
  userId: string
  email: string
  fullName: string
}
```

### Pattern 3: Lib Helpers (Dependency Inversion)
API routes NEVER import SDK clients directly. They always import from `/lib/`:

```typescript
// ✅ CORRECT
import { generateVideoUploadUrl } from '@/lib/bunny'
import { sendWelcomeEmail } from '@/lib/email'

// ❌ WRONG — never do this in a route file
import Resend from 'resend'
import * as bunnySdk from 'bunny-sdk'
```

### Pattern 4: Zod Validation
All schemas live in `/lib/validations/`. Import the schema in the route, never define inline:

```typescript
// lib/validations/auth.ts
export const RegisterSchema = z.object({
  fullName: z.string().min(2).max(255),
  email: z.string().email(),
  password: z.string().min(8).max(100),
})

// app/api/auth/register/route.ts
import { RegisterSchema } from '@/lib/validations/auth'
```

### Pattern 5: Error Responses
Always return structured errors:

```typescript
// 400 Validation
{ error: 'Validation failed', details: result.error.flatten() }

// 401 Unauthenticated
{ error: 'Unauthorized' }

// 403 Forbidden (authenticated but not allowed)
{ error: 'Forbidden', message: 'Active subscription required' }

// 404
{ error: 'Not found' }

// 405 Method not allowed (for film edit attempts)
{ error: 'Method not allowed' }

// 500
{ error: 'Internal server error' }
```

### Pattern 6: Environment Variables
Access via a typed config object, never `process.env.X` scattered across files:

```typescript
// lib/config.ts — create this in Phase 0
export const config = {
  jwt: {
    secret: process.env.JWT_SECRET!,
    refreshSecret: process.env.JWT_REFRESH_SECRET!,
    accessExpiresIn: '15m',
    refreshExpiresIn: '7d',
  },
  db: {
    url: process.env.DATABASE_URL!,
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

---

## Environment Variables Reference

Create `.env.local` with these values (get from each service dashboard):

```bash
# Database (Supabase)
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"

# Auth
JWT_SECRET="<generate: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\">"
JWT_REFRESH_SECRET="<generate same way — must be different from JWT_SECRET>"

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
BUNNY_STORAGE_CDN_URL=""   # e.g. https://indiefilm.b-cdn.net

# Email (Resend)
RESEND_API_KEY=""
EMAIL_FROM="noreply@indiefilmcinema.com"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"  # change to production URL on deploy
```

---

## Complete Prisma Schema

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

model User {
  id              String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  email           String    @unique @db.VarChar(255)
  passwordHash    String    @db.VarChar(255)
  fullName        String    @db.VarChar(255)
  isEmailVerified Boolean   @default(false)
  isSuspended     Boolean   @default(false)
  createdAt       DateTime  @default(now()) @db.Timestamptz
  updatedAt       DateTime  @updatedAt @db.Timestamptz

  subscription          Subscription?
  emailVerifyTokens     EmailVerificationToken[]
  passwordResetTokens   PasswordResetToken[]
  filmSubmissions       FilmSubmission[]

  @@map("users")
}

model Subscription {
  id                String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId            String    @unique @db.Uuid
  lsSubscriptionId  String    @unique @db.VarChar(255)
  lsCustomerId      String    @db.VarChar(255)
  lsVariantId       String?   @db.VarChar(255)
  status            String    @db.VarChar(20)   // PENDING|ACTIVE|PAST_DUE|CANCELLED|EXPIRED
  currentPeriodEnd  DateTime? @db.Timestamptz
  cancelledAt       DateTime? @db.Timestamptz
  createdAt         DateTime  @default(now()) @db.Timestamptz
  updatedAt         DateTime  @updatedAt @db.Timestamptz

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("subscriptions")
}

model EmailVerificationToken {
  id        String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId    String    @db.Uuid
  token     String    @unique @db.VarChar(255)
  expiresAt DateTime  @db.Timestamptz
  usedAt    DateTime? @db.Timestamptz
  createdAt DateTime  @default(now()) @db.Timestamptz

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([token])
  @@map("email_verification_tokens")
}

model PasswordResetToken {
  id        String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  userId    String    @db.Uuid
  token     String    @unique @db.VarChar(255)
  expiresAt DateTime  @db.Timestamptz
  usedAt    DateTime? @db.Timestamptz
  createdAt DateTime  @default(now()) @db.Timestamptz

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([token])
  @@map("password_reset_tokens")
}

model FilmSubmission {
  id                  String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  filmakerId          String    @db.Uuid
  status              String    @default("SUBMITTED") @db.VarChar(20)

  // Film Details
  filmTitle           String    @db.VarChar(500)
  logline             String    @db.Text
  runningTimeSeconds  Int
  primaryGenre        String    @db.VarChar(100)
  countryOfOrigin     String    @db.VarChar(100)
  targetCountries     String[]  @default([])
  targetReleaseYear   Int?      @db.SmallInt

  // Cast & Crew
  directorName        String    @db.VarChar(255)
  producerName        String?   @db.VarChar(255)
  writerName          String?   @db.VarChar(255)
  cinematographerName String?   @db.VarChar(255)

  // Market & Distribution
  marketInterests     String[]  @default([])
  narrativeScale      Int       @db.SmallInt

  // Files
  posterBunnyUrl      String?   @db.VarChar(1000)
  posterBunnyObject   String?   @db.VarChar(500)
  thumbnailBunnyUrl   String    @db.VarChar(1000)
  thumbnailBunnyObject String   @db.VarChar(500)
  youtubeTrailerUrl   String    @db.VarChar(500)
  videoBunnyVideoId   String    @db.VarChar(255)
  videoBunnyLibraryId String    @db.VarChar(255)

  submittedAt         DateTime  @default(now()) @db.Timestamptz

  filmmaker User @relation(fields: [filmakerId], references: [id])

  @@index([filmakerId])
  @@map("film_submissions")
}
```

---

## Verification: How to Know Each Phase Is Complete

At the end of each phase, you must be able to:
- Run `npm run dev` without errors
- Run `npx prisma studio` and see the expected tables populated
- Manually test the described flow in the browser
- See no TypeScript errors (`npx tsc --noEmit`)

---

*Proceed to [Phase 0 →](./01_PHASE_0_SCAFFOLD.md)*