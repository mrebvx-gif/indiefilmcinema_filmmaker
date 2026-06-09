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
