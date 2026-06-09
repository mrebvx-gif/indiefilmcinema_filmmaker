# Phase 6 — Polish & Deploy

> **Goal:** Finalise the application with security hardening, improved error handling, loading states, and deploy it to Vercel production.
>
> **When this phase is done:** The app is secure, robust against malicious inputs, provides excellent UX during loading/errors, and is live on the internet under a custom domain.

---

## Step 6.1 — Security Hardening & Rate Limiting

Because the app is exposed to the internet, basic protections are required.

1. **Rate Limiting:**
   Since Vercel serverless functions do not persist state well, consider using a lightweight rate limiter for authentication routes. If using Upstash Redis is acceptable for the free tier:
   - Add `@upstash/ratelimit` and `@upstash/redis`.
   - Apply rate limiting to `POST /api/auth/login`, `POST /api/auth/register`, and `POST /api/auth/forgot-password` (e.g., max 10 requests per minute per IP).

2. **Security Headers:**
   Update `next.config.js` to include basic security headers:
   ```javascript
   module.exports = {
     async headers() {
       return [
         {
           source: '/(.*)',
           headers: [
             { key: 'X-Content-Type-Options', value: 'nosniff' },
             { key: 'X-Frame-Options', value: 'DENY' },
             { key: 'X-XSS-Protection', value: '1; mode=block' },
           ],
         },
       ]
     },
   }
   ```

3. **CORS:** Ensure your API routes only respond to requests from your own domain (Vercel sets this up securely by default, but double-check any custom configurations).

---

## Step 6.2 — UX Polish

1. **Loading States:**
   - Add `loading.tsx` files to your App Router directories (e.g., `app/(portal)/dashboard/loading.tsx`) with skeleton loaders using shadcn's `<Skeleton />` component to prevent jarring layout shifts.
2. **Error Boundaries:**
   - Add `error.tsx` files to catch unexpected client-side crashes and provide a friendly "Something went wrong" UI with a "Try again" button.
3. **Toast Notifications:**
   - Ensure the shadcn `<Toaster />` is properly utilized across the app. Use `toast({ title: 'Success', description: '...' })` for all major user actions (login, logout, subscribe, save).

---

## Step 6.3 — Clean Up & Audit

1. **Remove Console Logs:** Strip out any `console.log()` statements that expose sensitive data. Keep `console.error()` for server-side error logging.
2. **Typescript Strict Mode:** Run `npx tsc --noEmit` to ensure there are zero TypeScript errors.
3. **Environment Variables Check:** Verify `.env.example` has all required keys listed.

---

## Step 6.4 — Vercel Deployment

1. Push all final code to the main branch on GitHub.
2. In the Vercel Dashboard, import the repository.
3. **Crucial:** Add ALL environment variables specified in your `.env` file into the Vercel Project Settings.
   *Ensure you add `DATABASE_URL` (Supabase Pooler string) and `DIRECT_URL` (Supabase direct string).*
4. Deploy the project.
5. In Vercel, attach your custom domain (e.g., `panel.indiefilmcinema.com`).
6. **Post-Deploy Steps:**
   - Update the Lemon Squeezy Webhook URL in the Lemon Squeezy dashboard to point to your live Vercel domain.
   - Update `NEXT_PUBLIC_APP_URL` in Vercel to your live domain so emails link correctly.

---

## Phase 6 Verification Checklist

- [ ] Rate limits prevent spamming the login/register endpoints.
- [ ] Loading skeletons appear when navigating to the dashboard or submission detail page.
- [ ] Production build (`npm run build`) completes with zero errors.
- [ ] The app is successfully deployed to Vercel.
- [ ] You can complete the full flow (Register -> Subscribe -> Dashboard -> Submit) on the LIVE production URL.
- [ ] Webhooks trigger correctly in production.

---

*Congratulations! The Indie Film Cinema Admin Portal v2.0 is complete.*
