import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * This route is kept for backward compatibility but is no longer needed
 * Supabase handles sessions automatically via cookies
 */
export async function POST() {
  // Supabase handles sessions automatically, no action needed
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  // Session deletion is handled by /api/auth/logout
  return NextResponse.json({ ok: true });
}
