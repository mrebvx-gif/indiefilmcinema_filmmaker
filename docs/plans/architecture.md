**INDIE FILM CINEMA**

**Filmmaker Admin Panel**

_Architecture & Technical Specification - v2.0_

| **Version**            | 2.0                                                                        |
| ---------------------- | -------------------------------------------------------------------------- |
| **Date**               | June 2026                                                                  |
| **Status**             | Final - Developer Handoff                                                  |
| **Prepared For**       | IndieFilmCinema.com (Vance Technology)                                     |
| **Stack**              | Next.js · Supabase · Vercel · BunnyCDN · Lemon Squeezy                     |
| **Key Change from v1** | Replaced AWS + NestJS + Docker with Vercel + Supabase + Next.js API Routes |

# **1\. Project Overview**

The Indie Film Cinema Filmmaker Admin Panel is a password-protected web application built entirely with Next.js 14 (App Router), hosted on Vercel, with Supabase (PostgreSQL) as the database. It allows independent filmmakers to register, activate a \$6.50/month subscription via Lemon Squeezy, and submit their films - including all metadata and the video file - directly to BunnyCDN storage.

This is NOT a public viewer site. It is a submission portal. Once a filmmaker submits their film, the video is stored on BunnyCDN and the metadata is saved in the Supabase database. The platform owner manually publishes films to the live WordPress site. Submissions are final and cannot be edited.

| **v2.0 Architecture Decisions**                                                                                                           |
| ----------------------------------------------------------------------------------------------------------------------------------------- |
| No separate backend server. All API logic lives in Next.js API Routes (/app/api/\*\*). One codebase, one deployment.                      |
| No Docker. No AWS. No server management. Vercel handles deployment; Supabase handles the database.                                        |
| No NestJS. The SOLID module structure is preserved through folder conventions and service classes, not a framework.                       |
| Supabase provides PostgreSQL + connection pooling (PgBouncer) + automatic backups + a dashboard UI for the client to inspect submissions. |
| Total estimated monthly cost at launch: \$0 (free tiers cover prototype). Scales to ~\$20-45/mo at production load.                       |

## **1.1 What This System Does and Does Not Cover**

IN SCOPE:

- Filmmaker registration, email verification, login, and session management
- \$6.50/month subscription gate via Lemon Squeezy (blocks portal access until paid)
- Film submission form with all required metadata fields
- Direct browser-to-BunnyCDN upload for video files, poster art, and thumbnails
- Submission history dashboard - filmmakers can view their own past submissions (read-only)

OUT OF SCOPE:

- The public viewer site (indiefilmcinema.com / WordPress) - not touched by this system
- How the client publishes films to WordPress after receiving a submission
- Video streaming or playback - BunnyCDN stores the file; this system's job ends there
- An admin interface for the platform owner - they use the Supabase dashboard directly

# **2\. Hosting & Cost Breakdown**

Every service used has a generous free tier that covers the prototype and early launch phase. No credit card required for Vercel or Supabase free tiers.

| **Service**       | **Free Tier**                                                               | **Paid Tier**                                                              | **Notes**                                                                                                                    |
| ----------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **Vercel**        | Free: unlimited personal projects, 100GB bandwidth/mo, serverless functions | Pro: \$20/mo - needed if bandwidth or function execution exceeds free tier | Hosts Next.js frontend + API routes. Deploys automatically on every Git push. Zero config for Next.js.                       |
| **Supabase**      | Free: 500MB database, 5GB bandwidth, 50MB file storage, 2 projects          | Pro: \$25/mo - adds 8GB DB, daily backups, no pausing                      | PostgreSQL database + PgBouncer connection pooling. Free tier pauses after 7 days inactivity (dev only - Pro prevents this). |
| **BunnyCDN**      | No free tier - pay-as-you-go                                                | Storage: ~\$0.02/GB/mo. Bandwidth: ~\$0.01/GB. Stream: ~\$0.005/min stored | Very low cost for video. A 2-hour 4K film (~50GB) costs ~\$1/mo to store. Pricing calculator at bunny.net.                   |
| **Lemon Squeezy** | Free to use                                                                 | Takes 3.5% + \$0.30 per transaction                                        | No monthly fee. On \$6.50/mo subscription: LS takes ~\$0.53, client receives ~\$5.97 per filmmaker per month.                |
| **Resend**        | Free: 3,000 emails/mo, 100/day                                              | \$20/mo: 50,000 emails/mo                                                  | Transactional email. Free tier is more than enough for prototype and early launch.                                           |

| **Estimated Monthly Cost Summary**                                                      |
| --------------------------------------------------------------------------------------- |
| Prototype / Early launch (< 50 filmmakers): \$0/mo (all free tiers)                     |
| Growing platform (50-500 filmmakers): ~\$20-45/mo (Vercel Pro + Supabase Pro)           |
| Scale (500+ filmmakers): Revisit - add Redis caching, evaluate DB size                  |
|                                                                                         |
| Compare to AWS v1 estimate: ~\$80-150/mo minimum (ECS + RDS + ALB + data transfer)      |
| Saving: ~\$80-150/mo at launch. Dev time saved: 2-3 days of DevOps/infrastructure work. |

# **3\. System Architecture**

## **3.1 Technology Stack**

| **Layer**          | **Technology**                             | **Rationale**                                                                                                                                                                   |
| ------------------ | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Frontend + API** | Next.js 14 (App Router, React, TypeScript) | Single codebase for UI and API. Server Components for fast initial loads. API Routes (Route Handlers) replace the NestJS backend. Deployed to Vercel in one command.            |
| **API Layer**      | Next.js Route Handlers (/app/api/\*\*)     | Replace NestJS controllers. Organised by domain folder. Each route file exports GET/POST handlers. Middleware handles auth and subscription checks globally.                    |
| **Database**       | Supabase (PostgreSQL 15)                   | Managed PostgreSQL with automatic backups, connection pooling via PgBouncer, and a web dashboard. Free tier sufficient for prototype.                                           |
| **ORM**            | Prisma (with Supabase connection string)   | Type-safe DB access, clean migration system. Prisma connects to Supabase's PostgreSQL via the connection pooler URL. Same Prisma workflow as v1 - no change for developers.     |
| **Auth**           | NextAuth.js v5 (Auth.js) or custom JWT     | NextAuth simplifies session management in Next.js. Alternatively, custom JWT with HTTP-only cookies (same approach as v1 NestJS auth). Custom JWT recommended for full control. |
| **Payments**       | Lemon Squeezy                              | \$6.50/month subscription. Webhook handled in /app/api/webhooks/lemon-squeezy/route.ts. Same integration as v1.                                                                 |
| **Video CDN**      | BunnyCDN Stream                            | Direct browser upload to BunnyCDN Stream for video files. API route generates signed upload URL. Identical to v1 - no change.                                                   |
| **Image CDN**      | BunnyCDN Storage                           | Direct browser upload for poster art and thumbnails. Identical to v1.                                                                                                           |
| **Email**          | Resend                                     | Transactional email via Resend SDK called from Next.js API routes. Same 7 email triggers as v1.                                                                                 |
| **Hosting**        | Vercel                                     | Zero-config Next.js hosting. Auto-deploys on Git push. Serverless functions for API routes. Global CDN for static assets. Custom domain via Vercel dashboard.                   |
| **Secrets**        | Vercel Environment Variables               | All secrets (DB URL, JWT secret, LS API key, Bunny API key) stored in Vercel project settings. Injected at build/runtime. No .env files on production.                          |

## **3.2 Folder Structure (Next.js App Router)**

The codebase is organised so each domain is self-contained - preserving the spirit of SOLID modularity without a framework enforcing it.

| **PROJECT ROOT**                                                                                           |
| ---------------------------------------------------------------------------------------------------------- |
| /app Next.js App Router root                                                                               |
| /app/(auth) Auth pages: /login, /register, /verify-email, /forgot-password, /reset-password                |
| /app/(portal) Subscription-gated pages: /dashboard, /submit, /submit/success, /submissions/\[id\]          |
| /app/subscribe Subscription gate page (accessible without active sub)                                      |
| /app/api/auth/ API routes: register, login, logout, refresh, verify-email, forgot-password, reset-password |
| /app/api/subscriptions/ API routes: status, checkout-url, portal-url                                       |
| /app/api/webhooks/ API route: lemon-squeezy (webhook receiver)                                             |
| /app/api/films/ API routes: GET list, POST create, GET \[id\]                                              |
| /app/api/uploads/ API routes: video-url, image-url, confirm-video                                          |
| /lib/db.ts Prisma client singleton                                                                         |
| /lib/auth.ts JWT helpers: sign, verify, extract from request                                               |
| /lib/bunny.ts BunnyCDN API helpers: generate upload URL, confirm video                                     |
| /lib/lemonsqueezy.ts LS API helpers: checkout URL, portal URL, webhook verify                              |
| /lib/email.ts Resend email dispatch helpers                                                                |
| /lib/validations/ Zod schemas for all API request bodies (replaces class-validator DTOs)                   |
| /middleware.ts Next.js middleware: JWT check + subscription check on /dashboard, /submit, /submissions     |
| /prisma/schema.prisma Prisma schema (all tables)                                                           |
| /prisma/migrations/ Prisma migration history                                                               |

## **3.3 Request Flow Diagram (Description)**

| **BROWSER (Filmmaker)**                                                                  |
| ---------------------------------------------------------------------------------------- |
| \|                                                                                       |
| \| HTTPS                                                                                 |
| v                                                                                        |
| **VERCEL EDGE NETWORK (serves static assets from CDN, routes dynamic requests)**         |
| \|                                                                                       |
| \| middleware.ts runs first on every request to /(portal)/\*\* routes                    |
| \| Checks JWT cookie -> valid? Check subscription status in DB -> active? Allow through. |
| v                                                                                        |
| **NEXT.JS SERVER (Vercel Serverless Function)**                                          |
| \|-- Page requests -> React Server Component renders HTML                                |
| \|-- API requests -> /app/api/\*\*/route.ts handler executes                             |
| \|                                                                                       |
| \|-- DB queries -> Supabase PostgreSQL (via Prisma + PgBouncer connection pooler)        |
| \|-- Video upload URL -> BunnyCDN Stream API (generate signed upload URL)                |
| \|-- Image upload URL -> BunnyCDN Storage API (generate signed PUT URL)                  |
| \|-- Checkout URL -> Lemon Squeezy API                                                   |
| \|-- Send email -> Resend API                                                            |
| \|                                                                                       |
| v                                                                                        |
| **BROWSER uploads file directly -> BunnyCDN (API server never handles file bytes)**      |
| **BROWSER redirects for payment -> Lemon Squeezy hosted checkout**                       |
| **Lemon Squeezy sends webhook -> POST /api/webhooks/lemon-squeezy -> Vercel function**   |

## **3.4 SOLID Principles in Next.js (Without NestJS)**

Without NestJS enforcing structure, the same principles are maintained through conventions:

| **SOLID Principle**   | **How it is enforced in this Next.js architecture**                                                                                                                                                                         |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Single Responsibility | Each /app/api/\*\* folder handles exactly one domain. /app/api/films/ only handles film submissions. /app/api/uploads/ only handles BunnyCDN URL generation. No route file does two different jobs.                         |
| Open/Closed           | New features = new folders/files. Adding a 'notifications' feature means adding /app/api/notifications/ - no existing routes are modified. /lib/ helpers are extended by adding new functions, not modifying existing ones. |
| Liskov Substitution   | All API route handlers follow the same signature: (request: NextRequest) => Promise&lt;NextResponse&gt;. They are interchangeable from the middleware's perspective. Any handler can be replaced without breaking callers.  |
| Interface Segregation | Zod schemas in /lib/validations/ define the exact shape each endpoint expects. No handler receives more data than it needs. The film submission schema is separate from the auth schema.                                    |
| Dependency Inversion  | /app/api/\*\* route handlers import from /lib/ helpers (db, bunny, email, lemonsqueezy) - never import SDK clients directly. If Resend is replaced with SendGrid, only /lib/email.ts changes. No route files change.        |

# **4\. Database Schema (Supabase PostgreSQL via Prisma)**

Schema is defined in /prisma/schema.prisma and deployed via prisma migrate deploy. Supabase provides the PostgreSQL 15 instance. Prisma connects via Supabase's connection pooler URL (port 6543) for serverless compatibility - critical for Vercel, where each API route invocation creates a new connection.

| **Supabase Connection Setup for Prisma + Vercel (Critical)**                              |
| ----------------------------------------------------------------------------------------- |
| Vercel serverless functions are stateless - each invocation may open a new DB connection. |
| Use Supabase's Transaction Mode pooler URL (port 6543) as DATABASE_URL in Prisma.         |
| Also set DIRECT_URL to the direct connection string (port 5432) for prisma migrate only.  |
| In prisma/schema.prisma:                                                                  |
| datasource db {                                                                           |
| provider = "postgresql"                                                                   |
| url = env("DATABASE_URL") // pooler URL - used at runtime                                 |
| directUrl = env("DIRECT_URL") // direct URL - used for migrations only                    |
| }                                                                                         |
| Both values are set in Vercel Environment Variables. Never committed to Git.              |

**Table: users**

| **Column**            | **Type**                  | **Nullable** | **Description**                      |
| --------------------- | ------------------------- | ------------ | ------------------------------------ |
| **id**                | UUID (PK)                 | **NO**       | Primary key - gen_random_uuid()      |
| **email**             | VARCHAR(255) UNIQUE       | **NO**       | Login email                          |
| **password_hash**     | VARCHAR(255)              | **NO**       | bcrypt hash, min 12 rounds           |
| **full_name**         | VARCHAR(255)              | **NO**       | Filmmaker's full name                |
| **is_email_verified** | BOOLEAN DEFAULT false     | **NO**       | True after verification link clicked |
| **is_suspended**      | BOOLEAN DEFAULT false     | **NO**       | Blocks login if true                 |
| **created_at**        | TIMESTAMPTZ DEFAULT now() | **NO**       | Account creation time                |
| **updated_at**        | TIMESTAMPTZ               | **NO**       | Updated on any change                |

**Table: subscriptions**

| **Column**             | **Type**                  | **Nullable** | **Description**                                       |
| ---------------------- | ------------------------- | ------------ | ----------------------------------------------------- |
| **id**                 | UUID (PK)                 | **NO**       | Primary key                                           |
| **user_id**            | UUID FK → users           | **NO**       | One-to-one. Cascade delete.                           |
| **ls_subscription_id** | VARCHAR(255) UNIQUE       | **NO**       | Lemon Squeezy subscription ID                         |
| **ls_customer_id**     | VARCHAR(255)              | **NO**       | Lemon Squeezy customer ID                             |
| **status**             | VARCHAR(20)               | **NO**       | PENDING \| ACTIVE \| PAST_DUE \| CANCELLED \| EXPIRED |
| **current_period_end** | TIMESTAMPTZ               | **YES**      | End of current billing period - from LS webhook       |
| **ls_variant_id**      | VARCHAR(255)              | **YES**      | LS variant ID for \$6.50/mo plan                      |
| **cancelled_at**       | TIMESTAMPTZ               | **YES**      | Populated on cancellation                             |
| **created_at**         | TIMESTAMPTZ DEFAULT now() | **NO**       | Created on subscription_created webhook               |
| **updated_at**         | TIMESTAMPTZ               | **NO**       | Updated on every webhook                              |

**Table: email_verification_tokens**

| **Column**     | **Type**                  | **Nullable** | **Description**                        |
| -------------- | ------------------------- | ------------ | -------------------------------------- |
| **id**         | UUID (PK)                 | **NO**       | Primary key                            |
| **user_id**    | UUID FK → users           | **NO**       | Owner of this token                    |
| **token**      | VARCHAR(255) UNIQUE       | **NO**       | crypto.randomBytes(32).toString('hex') |
| **expires_at** | TIMESTAMPTZ               | **NO**       | 24 hours after creation                |
| **used_at**    | TIMESTAMPTZ               | **YES**      | NULL = unused. Populated on click.     |
| **created_at** | TIMESTAMPTZ DEFAULT now() | **NO**       | Creation time                          |

**Table: password_reset_tokens**

| **Column**     | **Type**                  | **Nullable** | **Description**                        |
| -------------- | ------------------------- | ------------ | -------------------------------------- |
| **id**         | UUID (PK)                 | **NO**       | Primary key                            |
| **user_id**    | UUID FK → users           | **NO**       | Owner of this token                    |
| **token**      | VARCHAR(255) UNIQUE       | **NO**       | crypto.randomBytes(32).toString('hex') |
| **expires_at** | TIMESTAMPTZ               | **NO**       | 1 hour after creation                  |
| **used_at**    | TIMESTAMPTZ               | **YES**      | NULL = unused. Single-use.             |
| **created_at** | TIMESTAMPTZ DEFAULT now() | **NO**       | Creation time                          |

**Table: film_submissions**

| **Column**                 | **Type**                        | **Nullable** | **Description**                                                                        |
| -------------------------- | ------------------------------- | ------------ | -------------------------------------------------------------------------------------- |
| **id**                     | UUID (PK)                       | **NO**       | Primary key                                                                            |
| **filmmaker_id**           | UUID FK → users                 | **NO**       | Submitting filmmaker                                                                   |
| **status**                 | VARCHAR(20) DEFAULT 'SUBMITTED' | **NO**       | SUBMITTED only in V1. Immutable after creation.                                        |
| **film_title**             | VARCHAR(500)                    | **NO**       | Title in original language                                                             |
| **logline**                | TEXT                            | **NO**       | 1-2 sentence plot summary. Min 20 chars.                                               |
| **running_time_seconds**   | INTEGER                         | **NO**       | Stored as total seconds. Display as HH:MM:SS.                                          |
| **primary_genre**          | VARCHAR(100)                    | **NO**       | Horror, Drama, Documentary, etc.                                                       |
| **country_of_origin**      | VARCHAR(100)                    | **NO**       | ISO country name                                                                       |
| **target_countries**       | TEXT\[\]                        | **YES**      | Array of target distribution countries. Default: {}.                                   |
| **target_release_year**    | SMALLINT                        | **YES**      | 4-digit year. Nullable if not known.                                                   |
| **director_name**          | VARCHAR(255)                    | **NO**       | Required.                                                                              |
| **producer_name**          | VARCHAR(255)                    | **YES**      | Optional.                                                                              |
| **writer_name**            | VARCHAR(255)                    | **YES**      | Optional.                                                                              |
| **cinematographer_name**   | VARCHAR(255)                    | **YES**      | Optional.                                                                              |
| **market_interests**       | TEXT\[\]                        | **YES**      | FESTIVAL_LOCAL \| FESTIVAL_INTERNATIONAL \| THEATRICAL \| STREAMING_VOD \| EDUCATIONAL |
| **narrative_scale**        | SMALLINT                        | **NO**       | Integer 1 (traditional) to 7 (experimental). Required.                                 |
| **poster_bunny_url**       | VARCHAR(1000)                   | **YES**      | BunnyCDN Storage CDN URL. NULL if not uploaded.                                        |
| **poster_bunny_object**    | VARCHAR(500)                    | **YES**      | BunnyCDN Storage object key for poster.                                                |
| **thumbnail_bunny_url**    | VARCHAR(1000)                   | **NO**       | Required. BunnyCDN Storage CDN URL.                                                    |
| **thumbnail_bunny_object** | VARCHAR(500)                    | **NO**       | BunnyCDN Storage object key for thumbnail.                                             |
| **youtube_trailer_url**    | VARCHAR(500)                    | **NO**       | Validated YouTube URL.                                                                 |
| **video_bunny_video_id**   | VARCHAR(255)                    | **NO**       | BunnyCDN Stream video ID. Confirmed before submit.                                     |
| **video_bunny_library_id** | VARCHAR(255)                    | **NO**       | BunnyCDN Stream library ID (from env var).                                             |
| **submitted_at**           | TIMESTAMPTZ DEFAULT now()       | **NO**       | Final submission timestamp. Immutable.                                                 |

**Note:** _No UPDATE or DELETE endpoints exist for film_submissions. The table is append-only. The platform owner can view all submissions directly in the Supabase dashboard (Table Editor) without needing a custom admin UI._

# **5\. API Route Specification**

All routes live under /app/api/\*\*. Each folder contains a route.ts file exporting named HTTP method handlers. Validation uses Zod schemas. Auth is checked via a helper function getAuthenticatedUser(request) imported from /lib/auth.ts.

## **5.1 Auth Routes (/app/api/auth/\*\*)**

| **Route file**                            | **Method** | **Behaviour**                                                                                                                                                                                                                                    |
| ----------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **/auth/register/route.ts**               | POST       | Body: { full_name, email, password }. Zod validates. Hash password (bcrypt, 12 rounds). Insert into users. Create email_verification_token. Send verification email via Resend. Return 201.                                                      |
| **/auth/verify-email/\[token\]/route.ts** | GET        | Find token, check not expired, check not used. Mark user.is_email_verified = true. Mark token.used_at = now(). Redirect to /login?verified=true.                                                                                                 |
| **/auth/login/route.ts**                  | POST       | Body: { email, password }. Find user, verify bcrypt hash. Check is_email_verified (return 403 with message if not). Check not suspended. Sign JWT access token (15m). Set refresh token in HTTP-only cookie (7d). Return { access_token, user }. |
| **/auth/refresh/route.ts**                | POST       | Read refresh_token cookie. Verify signature + expiry. Issue new access token. Rotate refresh token (new cookie). Return { access_token }.                                                                                                        |
| **/auth/logout/route.ts**                 | POST       | Clear refresh_token cookie. Return 200.                                                                                                                                                                                                          |
| **/auth/forgot-password/route.ts**        | POST       | Body: { email }. Find user (silently ignore if not found - no enumeration). Create password_reset_token. Send reset email. Always return 200.                                                                                                    |
| **/auth/reset-password/route.ts**         | POST       | Body: { token, new_password }. Validate token. Hash new password. Update user. Mark token used. Return 200.                                                                                                                                      |

## **5.2 Subscription Routes (/app/api/subscriptions/\*\*)**

| **Route file**                           | **Method** | **Behaviour**                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ---------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **/subscriptions/status/route.ts**       | GET        | Auth required. Query subscriptions table by user_id. Return { status, current_period_end, is_active: status === 'ACTIVE' }. If no row exists, return { status: 'NONE', is_active: false }.                                                                                                                                                                                                                                                             |
| **/subscriptions/checkout-url/route.ts** | GET        | Auth required. Call Lemon Squeezy API to create checkout session with: variant_id from env, custom data { user_id }, prefilled email + name, success/cancel redirect URLs. Return { checkout_url }.                                                                                                                                                                                                                                                    |
| **/subscriptions/portal-url/route.ts**   | GET        | Auth required. Subscription must exist. Call LS API with ls_customer_id to get billing portal URL. Return { portal_url }.                                                                                                                                                                                                                                                                                                                              |
| **/webhooks/lemon-squeezy/route.ts**     | POST       | PUBLIC but signature-verified. Verify X-Signature HMAC-SHA256. Parse event type. Route to handler. Return 200 immediately. Events: subscription_created → insert subscriptions row + send welcome email. subscription_updated / subscription_payment_success → update status + current_period_end. subscription_payment_failed → set PAST_DUE + send email. subscription_cancelled → set CANCELLED + cancelled_at. subscription_expired → set EXPIRED. |

## **5.3 Film Routes (/app/api/films/\*\*)**

| **Route file**             | **Method** | **Behaviour**                                                                                                                                                                                                                                                                      |
| -------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **/films/route.ts**        | GET        | Auth + active subscription required. Query film_submissions WHERE filmmaker_id = user.id ORDER BY submitted_at DESC. Return paginated list: { id, film_title, primary_genre, status, submitted_at, thumbnail_bunny_url, running_time_seconds }.                                    |
| **/films/route.ts**        | POST       | Auth + active subscription required. Zod validate full submission body. Confirm video_bunny_video_id exists in BunnyCDN (call /uploads/confirm-video internally or re-verify). Insert film_submissions record. Send submission confirmation email. Return 201 with created record. |
| **/films/\[id\]/route.ts** | GET        | Auth + active subscription required. Fetch submission by id WHERE filmmaker_id = user.id (ownership check - return 403 if mismatch). Return full submission detail.                                                                                                                |

**Note:** _There are no PUT or DELETE handlers for /films/\*\*. These HTTP methods are intentionally unimplemented. Any attempt to call them returns 405 Method Not Allowed._

## **5.4 Upload Routes (/app/api/uploads/\*\*)**

| **Route file**                      | **Method** | **Behaviour**                                                                                                                                                                                                                                                                                                                       |
| ----------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **/uploads/video-url/route.ts**     | POST       | Auth + active sub. Body: { filename, file_size_bytes }. Call BunnyCDN Stream API: create video object → returns { VideoId, UploadUrl }. Store VideoId for later confirmation. Return { bunny_video_id, upload_url }. Frontend uploads file directly to upload_url via HTTP PUT.                                                     |
| **/uploads/image-url/route.ts**     | POST       | Auth + active sub. Body: { filename, file_size_bytes, purpose: 'poster' \| 'thumbnail' }. Validate MIME type is image/jpeg or image/png (from filename extension). Generate object_name: films/{user_id}/{uuid}/{sanitised_filename}. Call BunnyCDN Storage API for signed PUT URL. Return { object_name, upload_url, public_url }. |
| **/uploads/confirm-video/route.ts** | POST       | Auth + active sub. Body: { bunny_video_id }. Call BunnyCDN Stream API to fetch video metadata by ID. Verify video exists and status is not 'error'. Return { confirmed: true } or { confirmed: false, reason }.                                                                                                                     |

# **6\. Next.js Middleware (Auth & Subscription Gate)**

A single middleware.ts at the project root intercepts all requests to /(portal)/\*\* routes before the page or API handler runs. This is the primary access control layer.

| **middleware.ts - Logic Flow**                                                                                      |
| ------------------------------------------------------------------------------------------------------------------- |
|                                                                                                                     |
| export const config = { matcher: \['/dashboard/:path\*', '/submit/:path\*', '/submissions/:path\*'\] }              |
|                                                                                                                     |
| 1\. Read access_token from Authorization header or access_token cookie.                                             |
| 2\. If missing or invalid JWT signature: redirect to /login?redirect={encodedPath}.                                 |
| 3\. Decode JWT to extract { userId, email }.                                                                        |
| 4\. Query Supabase: SELECT status FROM subscriptions WHERE user_id = userId.                                        |
| 5\. If status === 'ACTIVE': allow request through (call next()).                                                    |
| 6\. If status is anything else (PENDING, PAST_DUE, CANCELLED, EXPIRED, or no row): redirect to /subscribe.          |
|                                                                                                                     |
| IMPORTANT: /subscribe is NOT in the matcher list. It is always accessible to logged-in users.                       |
| IMPORTANT: Middleware DB query must be fast. Use Supabase's pooler connection. Add index on subscriptions(user_id). |

The middleware performs one DB query on every protected page load. To keep this fast:

- Index: CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id) - add to Prisma schema.
- The query selects only the status column - minimal data transfer.
- Supabase's PgBouncer pooler keeps connections warm - no cold-start penalty.
- Alternative: encode subscription status in the JWT payload (set on login, refreshed on subscription change webhook). This eliminates the DB query in middleware but requires re-issuing the JWT when subscription status changes. Simpler = DB query approach recommended for V1.

# **7\. File Upload Architecture (Direct to BunnyCDN)**

## **7.1 Why Direct Upload**

Vercel serverless functions have a 4.5MB request body limit on the free tier (50MB on Pro) and a 10-second execution timeout. Video files can be gigabytes. Routing file bytes through a Vercel function would hit both limits immediately. Instead, the API route generates a signed upload URL, and the browser uploads the file directly to BunnyCDN - bypassing Vercel entirely for the file transfer.

## **7.2 Video Upload Flow (BunnyCDN Stream)**

| **1** | **Select file** Filmmaker selects video file. Browser validates MIME type (video/mp4, video/quicktime, video/x-matroska). Shows filename + size. Upload does not start yet.                                                             |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **2** | **Request upload URL** Frontend calls POST /api/uploads/video-url with { filename, file_size_bytes }. API calls BunnyCDN Stream: POST <https://video.bunnycdn.com/library/{libraryId}/videos>. BunnyCDN returns { VideoId, UploadUrl }. |
| **3** | **API returns credentials** Response to frontend: { bunny_video_id, upload_url }. The upload_url is a direct PUT endpoint on BunnyCDN servers. Expires in 1 hour.                                                                       |
| **4** | **Direct upload** Frontend sends HTTP PUT to upload_url with the raw video file as the body (Content-Type: application/octet-stream). Uses XMLHttpRequest for progress events. Progress bar updated via xhr.upload.onprogress.          |
| **5** | **BunnyCDN processes** BunnyCDN receives the file, stores it, begins HLS transcoding. The VideoId is the permanent identifier for this file in the Stream library.                                                                      |
| **6** | **Confirm upload** After PUT returns 200, frontend calls POST /api/uploads/confirm-video with { bunny_video_id }. API verifies the video object exists in BunnyCDN and is not in an error state.                                        |
| **7** | **Enable submit** On confirmation success, form stores bunny_video_id. The Submit button becomes active. video_bunny_video_id is included in POST /api/films payload.                                                                   |

## **7.3 Image Upload Flow (BunnyCDN Storage - Poster & Thumbnail)**

| **1** | **Select image** Filmmaker selects JPEG or PNG. Browser validates type and checks size <= 10MB.                                                                                                                                                |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **2** | **Request signed URL** Frontend calls POST /api/uploads/image-url with { filename, file_size_bytes, purpose }. API constructs object path: films/{userId}/{uuid}/{filename}. API calls BunnyCDN Storage to get a signed PUT URL for that path. |
| **3** | **API returns upload credentials** Response: { object_name, upload_url, public_url }. The public_url is the final CDN URL (used for display and stored in DB after submit).                                                                    |
| **4** | **Direct upload** Frontend sends HTTP PUT to upload_url with the raw image bytes. BunnyCDN Storage accepts the file.                                                                                                                           |
| **5** | **Preview shown** Frontend displays the image using public_url immediately after upload completes (before form submit). Filmmaker sees a real preview of their poster/thumbnail.                                                               |
| **6** | **Stored on submit** When form is submitted, poster_bunny_url and thumbnail_bunny_url are included in POST /api/films. The API stores these URLs permanently in film_submissions.                                                              |

# **8\. Lemon Squeezy Integration**

## **8.1 Setup Checklist**

- Create Subscription product: 'Indie Film Cinema - Filmmaker Access', \$6.50/month. Note the Variant ID.
- Set webhook endpoint in LS dashboard: <https://panel.indiefilmcinema.com/api/webhooks/lemon-squeezy>
- Enable events: subscription_created, subscription_updated, subscription_payment_success, subscription_payment_failed, subscription_cancelled, subscription_expired.
- Copy Signing Secret → store as LS_WEBHOOK_SECRET in Vercel Environment Variables.
- Copy API Key → store as LEMON_SQUEEZY_API_KEY in Vercel Environment Variables.
- Copy Store ID → store as LEMON_SQUEEZY_STORE_ID in Vercel Environment Variables.
- Copy Variant ID → store as LEMON_SQUEEZY_VARIANT_ID in Vercel Environment Variables.

## **8.2 Checkout URL (GET /api/subscriptions/checkout-url)**

The API constructs a Lemon Squeezy checkout URL by calling the LS API with:

- store_id and variant_id from environment variables
- custom_data: { user_id: req.user.id } - maps the payment back to the filmmaker's account in the webhook
- checkout_data.email and checkout_data.name pre-filled from the authenticated user
- redirect_url: <https://panel.indiefilmcinema.com/dashboard?subscription=success>
- cancel_url: <https://panel.indiefilmcinema.com/subscribe?cancelled=true>

## **8.3 Webhook Handler (/app/api/webhooks/lemon-squeezy/route.ts)**

| **Event**                    | **Handler Action in route.ts**                                                                                                                                                                             |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| subscription_created         | Extract meta.custom_data.user_id. Upsert subscriptions row: { user_id, ls_subscription_id, ls_customer_id, ls_variant_id, status: 'ACTIVE', current_period_end }. Call sendWelcomeEmail(user). Return 200. |
| subscription_updated         | Find subscription by ls_subscription_id. Update status and current_period_end. Return 200.                                                                                                                 |
| subscription_payment_success | Update status to 'ACTIVE', update current_period_end. Covers recovery from PAST_DUE. Return 200.                                                                                                           |
| subscription_payment_failed  | Update status to 'PAST_DUE'. Call sendPaymentFailedEmail(user). Return 200.                                                                                                                                |
| subscription_cancelled       | Update status to 'CANCELLED', set cancelled_at = now(). Call sendCancelledEmail(user). Return 200.                                                                                                         |
| subscription_expired         | Update status to 'EXPIRED'. Return 200.                                                                                                                                                                    |

**Note:** _SECURITY: Verify X-Signature header on EVERY webhook before any processing. Use crypto.timingSafeEqual() for constant-time comparison. Reject with 401 on any mismatch. Use ls_subscription_id as idempotency key - check if event already processed before acting._

# **9\. Frontend Pages**

| **Route**           | **Page Description**                                                                                                                                                                                                                                                                                                            |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| /register           | Registration form: Full Name, Email, Password, Confirm Password. On submit → POST /api/auth/register. Show 'Check your email' state on success.                                                                                                                                                                                 |
| /login              | Email + password form. POST /api/auth/login. On success → redirect to /dashboard (middleware handles subscription check). Show 'Please verify your email first' if unverified.                                                                                                                                                  |
| /verify-email       | Reads token from URL query param. Calls GET /api/auth/verify-email/\[token\]. Shows success or expired/invalid state.                                                                                                                                                                                                           |
| /forgot-password    | Email input. POST /api/auth/forgot-password. Always shows 'If that email exists, a link was sent.'                                                                                                                                                                                                                              |
| /reset-password     | New password + confirm. POST /api/auth/reset-password. On success → /login.                                                                                                                                                                                                                                                     |
| /subscribe          | Subscription gate. Shown when logged in but subscription is not ACTIVE. Displays plan: \$6.50/month, what's included. 'Subscribe Now' → GET /api/subscriptions/checkout-url → redirect to Lemon Squeezy. Shows payment failed banner if status === 'PAST_DUE' with 'Update Billing' button → GET /api/subscriptions/portal-url. |
| /dashboard          | Main portal home (subscription-gated). Welcome message + subscription status badge. 'Upload New Film' CTA button. List of filmmaker's submissions from GET /api/films. Each card: thumbnail, title, genre, status badge, submitted date, running time, 'View Details' link. 'Manage Billing' link.                              |
| /submit             | Multi-section film submission form (subscription-gated). Five sections (A-E). File upload widgets with progress bars. Submit button disabled until all required fields valid + all uploads confirmed. On success → /submit/success.                                                                                             |
| /submit/success     | Confirmation screen. 'Your film has been received.' Shows film title. Button to return to dashboard. No further actions.                                                                                                                                                                                                        |
| /submissions/\[id\] | Read-only detail view of a single submission. All fields displayed in a structured layout. No edit button. Breadcrumb → /dashboard.                                                                                                                                                                                             |

# **10\. Environment Variables**

All secrets are stored in Vercel Environment Variables (Settings → Environment Variables). Never committed to Git. The .env.example file in the repo documents all required variable names without values.

| **Variable Name**        | **Description & Where to Get It**                                                                                                                |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| DATABASE_URL             | Supabase PostgreSQL connection pooler URL (port 6543, Transaction mode). Found in Supabase dashboard → Settings → Database → Connection pooling. |
| DIRECT_URL               | Supabase direct connection string (port 5432). Used only by prisma migrate. Same location as above.                                              |
| JWT_SECRET               | A random 256-bit secret string. Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"                          |
| JWT_REFRESH_SECRET       | A second random 256-bit string for signing refresh tokens. Same generation method.                                                               |
| LEMON_SQUEEZY_API_KEY    | API key from Lemon Squeezy dashboard → Settings → API.                                                                                           |
| LEMON_SQUEEZY_STORE_ID   | Store ID from Lemon Squeezy dashboard → Settings → Stores.                                                                                       |
| LEMON_SQUEEZY_VARIANT_ID | Variant ID of the \$6.50/month subscription product.                                                                                             |
| LS_WEBHOOK_SECRET        | Signing secret from LS dashboard → Settings → Webhooks → your webhook endpoint.                                                                  |
| BUNNY_API_KEY            | BunnyCDN account-level API key from bunny.net → Account → API.                                                                                   |
| BUNNY_STREAM_LIBRARY_ID  | The ID of your BunnyCDN Stream library (for video uploads).                                                                                      |
| BUNNY_STREAM_ACCESS_KEY  | BunnyCDN Stream library API access key (different from account key).                                                                             |
| BUNNY_STORAGE_ZONE_NAME  | Name of your BunnyCDN Storage Zone (for poster/thumbnail uploads).                                                                               |
| BUNNY_STORAGE_ACCESS_KEY | BunnyCDN Storage Zone password/access key.                                                                                                       |
| BUNNY_STORAGE_CDN_URL    | The pull zone CDN hostname for your storage zone (e.g. <https://indiefilm.b-cdn.net>).                                                           |
| RESEND_API_KEY           | API key from resend.com → API Keys.                                                                                                              |
| EMAIL_FROM               | Sending address (e.g. <noreply@indiefilmcinema.com>). Domain must be verified in Resend.                                                         |
| NEXT_PUBLIC_APP_URL      | The public URL of the panel (e.g. <https://panel.indiefilmcinema.com>). Used in email links.                                                     |

# **11\. Security**

| **Requirement**         | **Implementation**                                                                                                                                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Password storage        | bcrypt, 12 salt rounds. Never stored plain. Never logged or returned in API responses.                                                                                                                                   |
| JWT signing             | Access token: HS256, JWT_SECRET, 15-minute TTL. Refresh token: HS256, JWT_REFRESH_SECRET, 7-day TTL.                                                                                                                     |
| Refresh token storage   | HTTP-only, Secure, SameSite=Strict cookie. Cannot be accessed by JavaScript. Rotated on every refresh.                                                                                                                   |
| Webhook verification    | HMAC-SHA256 of raw request body vs X-Signature header. Use crypto.timingSafeEqual(). Reject with 401 on mismatch. Raw body must be read before JSON.parse (Next.js: await request.text() then JSON.parse).               |
| Rate limiting           | Use Vercel's built-in rate limiting (via vercel.json) or the upstash/ratelimit package with Upstash Redis free tier. Apply to /api/auth/login, /api/auth/register, /api/auth/forgot-password: 10 requests/minute per IP. |
| Input validation        | Zod schemas on all API route bodies. Parse with schema.safeParse(body) - reject with 400 if validation fails. No unvalidated user input reaches the database.                                                            |
| SQL injection           | Prisma parameterized queries throughout. Never use raw template string queries with user input.                                                                                                                          |
| Submission immutability | No PUT or DELETE route handlers exist for /api/films/\*\*. 405 returned for any unimplemented method.                                                                                                                    |
| HTTPS                   | Vercel enforces HTTPS on all deployments automatically. Custom domain uses Vercel's managed TLS certificate.                                                                                                             |
| CORS                    | Next.js API routes: only allow same-origin requests by default. If a separate domain needs access, configure explicit CORS headers in middleware.ts.                                                                     |
| User enumeration        | POST /api/auth/forgot-password always returns 200 regardless of email existence. Login returns generic 'Invalid credentials' message.                                                                                    |
| File type validation    | Client-side MIME type + extension check before requesting upload URL. Server-side: validate purpose field and reject unexpected MIME types in /api/uploads/image-url.                                                    |

# **12\. Deployment Guide (Vercel + Supabase)**

## **12.1 Initial Setup Steps**

| **1** | **Create Supabase project** Go to supabase.com → New project. Choose a region close to your target users (e.g. us-east-1 or eu-west-1). Note the database password. Copy both the pooler URL (port 6543) and direct URL (port 5432) from Settings → Database.                                  |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **2** | **Run Prisma migrations** Set DATABASE_URL (pooler) and DIRECT_URL (direct) in your local .env file. Run: npx prisma migrate deploy. This creates all tables in Supabase. Verify in Supabase dashboard → Table Editor.                                                                         |
| **3** | **Set up BunnyCDN** Create a Stream Library for videos (bunny.net → Stream). Enable direct upload. Note Library ID and Access Key. Create a Storage Zone for images. Attach a Pull Zone to it. Note Zone name, Access Key, and CDN hostname.                                                   |
| **4** | **Set up Lemon Squeezy** Create subscription product (\$6.50/mo). Note Store ID, Variant ID. Add webhook endpoint (use a temporary URL for now - update after Vercel deploy). Copy signing secret.                                                                                             |
| **5** | **Set up Resend** Create account at resend.com. Add and verify your sending domain (indiefilmcinema.com). Create API key. Add DNS records (SPF, DKIM) to your domain registrar as instructed by Resend.                                                                                        |
| **6** | **Deploy to Vercel** Push code to GitHub. Go to vercel.com → Import Project → select repo. Vercel auto-detects Next.js. Add all environment variables from Section 10 in Vercel project settings. Click Deploy.                                                                                |
| **7** | **Configure custom domain** In Vercel dashboard → Domains → add panel.indiefilmcinema.com (or chosen subdomain). Vercel provides DNS records to add at your registrar. TLS certificate is automatically provisioned.                                                                           |
| **8** | **Update LS webhook URL** Go back to Lemon Squeezy → Webhooks → update the endpoint URL to <https://panel.indiefilmcinema.com/api/webhooks/lemon-squeezy>. Send a test webhook to verify it reaches your Vercel deployment.                                                                    |
| **9** | **Smoke test** Register a test filmmaker account. Verify email. Pay test subscription (LS test mode). Fill and submit a test film with a small video file. Check Supabase dashboard to confirm film_submissions record was created. Check BunnyCDN Stream library to confirm video is present. |

## **12.2 Ongoing Development Workflow**

- Every push to the main branch triggers an automatic Vercel deployment (< 30 seconds).
- Prisma schema changes: update schema.prisma → run npx prisma migrate dev (local) → commit the new migration file → Vercel deployment automatically runs npx prisma migrate deploy on startup (add to package.json postbuild script or Vercel build command).
- Environment variable changes: update in Vercel dashboard → redeploy.
- Preview deployments: every pull request gets its own preview URL from Vercel (e.g. panel-git-feature-xyz.vercel.app). Use for testing before merging.

# **13\. Email Notifications**

| **Trigger**            | **Subject & Content**                                                                                                                                                                                                |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Registration           | Subject: 'Verify your Indie Film Cinema account'. Body: verification link (24h expiry). Called from: POST /api/auth/register.                                                                                        |
| Subscription activated | Subject: 'Welcome - your filmmaker account is now active'. Body: confirmation of \$6.50/mo activation, link to dashboard to submit first film. Called from: subscription_created webhook handler.                    |
| Payment failed         | Subject: 'Action required: payment failed for your subscription'. Body: notice that upload access is paused, link to /subscribe which has 'Update Billing' button. Called from: subscription_payment_failed webhook. |
| Subscription cancelled | Subject: 'Your subscription has been cancelled'. Body: access continues until end of billing period, option to resubscribe. Called from: subscription_cancelled webhook.                                             |
| Film submitted         | Subject: 'Film received: \[Film Title\]'. Body: list of key submitted details (title, genre, director, running time), note that the team will review and publish, no action required. Called from: POST /api/films.  |
| Password reset         | Subject: 'Reset your password'. Body: reset link (1h expiry). Note that if they did not request this, they can ignore. Called from: POST /api/auth/forgot-password.                                                  |

# **14\. Open Questions to Resolve Before Development**

- Subdomain: Should the panel be at panel.indiefilmcinema.com or admin.indiefilmcinema.com? Needed for: CORS config, cookie domain, Lemon Squeezy webhook URL, email links.
- Supabase Region: Which region to deploy Supabase in? Choose closest to the majority of filmmakers. Options: us-east-1 (N. Virginia), eu-west-1 (Ireland), ap-southeast-1 (Singapore) etc.
- Genre List: Should the Primary Genre dropdown be a hardcoded list in the frontend, or stored in a genres table and manageable without a code deploy? Hardcoded is simpler for V1 - confirm this is acceptable.
- BunnyCDN Account: Has the client already created a BunnyCDN account and set up a Stream Library and Storage Zone? Developer needs the Library ID, Access Key, Storage Zone name, and CDN pull zone hostname before building the upload flow.
- Email Sender Domain: Resend requires DNS records added to a verified domain. Confirm the client has access to the DNS settings for indiefilmcinema.com (or whichever domain will be used as the sender).
- Lemon Squeezy Account: Is the LS account already created and in live mode? Developer needs Store ID and Variant ID before building the subscription flow. Note: LS test mode should be used during development.
- Rate Limiting: The recommended approach uses Upstash Redis (free tier: 10,000 requests/day) for rate limiting on Vercel. Is this acceptable, or should a simpler in-memory approach be used for V1 (note: in-memory rate limiting does not work reliably across Vercel serverless function instances)?

_- End of Document -_

Indie Film Cinema | Filmmaker Admin Panel Architecture v2.0 | June 2026