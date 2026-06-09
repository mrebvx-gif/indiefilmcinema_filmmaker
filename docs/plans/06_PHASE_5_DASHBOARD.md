# Phase 5 — Dashboard & History

> **Goal:** Build the filmmaker's home portal where they can view a list of their past submissions and see the detailed view of each submission.
>
> **When this phase is done:** The Dashboard page populates with real data from the database. Clicking on a submission opens a detailed read-only view of that film's metadata.

---

## What Gets Built in This Phase

**API Routes:**
- `GET /api/films`
- `GET /api/films/[id]`

**Pages:**
- `/dashboard` — List view of all filmmaker submissions
- `/submissions/[id]` — Detailed view of a single submission

---

## Step 5.1 — Implement `GET /api/films`

Update `app/api/films/route.ts` to include the GET handler:

```typescript
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const submissions = await db.filmSubmission.findMany({
      where: { filmmakerId: user.userId },
      orderBy: { submittedAt: 'desc' },
      select: {
        id: true,
        filmTitle: true,
        primaryGenre: true,
        status: true,
        submittedAt: true,
        thumbnailBunnyUrl: true,
        runningTimeSeconds: true,
      }
    })

    return NextResponse.json(submissions)
  } catch (error) {
    console.error('[FILMS_GET]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

---

## Step 5.2 — Implement `GET /api/films/[id]`

Create `app/api/films/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(request)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const submission = await db.filmSubmission.findUnique({
      where: { id: params.id }
    })

    if (!submission) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Ensure the filmmaker only sees their own submissions
    if (submission.filmmakerId !== user.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(submission)
  } catch (error) {
    console.error('[FILMS_GET_BY_ID]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

---

## Step 5.3 — Build the Dashboard Page

Update `app/(portal)/dashboard/page.tsx` from its previous stub to a fully functional page.

Requirements:
- Fetch the user's films using `GET /api/films`.
- Display a prominent CTA button: "Upload New Film" linked to `/submit`.
- Provide a button/link to "Manage Billing" which calls `/api/subscriptions/portal-url` to open the Lemon Squeezy portal.
- Render a grid or list of cards for each submission.
- Each card should display the thumbnail image (`thumbnailBunnyUrl`), title, genre, submission date, and status.
- Clicking a card routes to `/submissions/[id]`.
- Empty state: If no films exist, display an encouraging message.

---

## Step 5.4 — Build the Submission Details Page

Create `app/(portal)/submissions/[id]/page.tsx`.

Requirements:
- Fetch the single film using `GET /api/films/[id]`.
- Display a "Back to Dashboard" link.
- Create a comprehensive layout displaying all fields:
  - Title, Logline, Status, Genre, Running Time.
  - Crew Details (Director, Producer, etc.).
  - Market Interests & Narrative Scale.
  - Show the YouTube Trailer URL.
  - Display the Poster Image and Thumbnail Image.
- Do NOT provide any "Edit" buttons. Submissions are immutable on the portal side.

*(Note: Since this is Next.js App Router, you can build these as Server Components to fetch data directly from `lib/db.ts` instead of hitting your own API endpoints if you prefer, but consuming the APIs maintains a clean separation.)*

---

## Phase 5 Verification Checklist

- [ ] `/dashboard` lists all films submitted by the current user.
- [ ] Users cannot see films submitted by other accounts.
- [ ] "Upload New Film" routes to `/submit`.
- [ ] Clicking "Manage Billing" opens the Lemon Squeezy customer portal.
- [ ] Clicking a film routes to `/submissions/[id]` and displays all metadata correctly.
- [ ] Attempting to access `/submissions/[id]` for a film owned by another user returns an error or 404.

---

*Phase 5 complete → Proceed to [Phase 6 — Polish & Deploy](./07_PHASE_6_POLISH.md)*
