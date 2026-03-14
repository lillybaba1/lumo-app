import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/check-business-name?name=...
 * Check if a business name is already taken (case-insensitive).
 * If taken, suggest up to 3 available alternatives.
 */
export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get('name')?.trim();

  if (!name || name.length < 2) {
    return NextResponse.json({ available: true, suggestions: [] });
  }

  try {
    // Case-insensitive exact match
    const { data: existing, error } = await supabaseAdmin
      .from('business_accounts')
      .select('id')
      .ilike('business_name', name)
      .maybeSingle();

    if (error) {
      console.error('[CheckBusinessName] DB error:', error);
      return NextResponse.json(
        { error: 'Failed to check business name' },
        { status: 500 }
      );
    }

    if (!existing) {
      return NextResponse.json({ available: true, suggestions: [] });
    }

    // Name is taken — generate suggestions and check which are available
    const candidates = generateCandidates(name);

    // Check all candidates in one query
    const { data: takenRows, error: sugError } = await supabaseAdmin
      .from('business_accounts')
      .select('business_name')
      .ilike('business_name', `${name}%`);

    if (sugError) {
      // Still return "taken" even if suggestion query fails
      return NextResponse.json({ available: false, suggestions: [] });
    }

    const takenSet = new Set(
      (takenRows || []).map((r: { business_name: string }) => r.business_name.toLowerCase().trim())
    );

    const suggestions = candidates
      .filter((c) => !takenSet.has(c.toLowerCase()))
      .slice(0, 3);

    return NextResponse.json({ available: false, suggestions });
  } catch (err) {
    console.error('[CheckBusinessName] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Failed to check business name' },
      { status: 500 }
    );
  }
}

/**
 * Generate a list of alternative name candidates based on the original.
 */
function generateCandidates(name: string): string[] {
  const candidates: string[] = [];
  const year = new Date().getFullYear();

  // Numeric suffixes
  for (let i = 2; i <= 6; i++) {
    candidates.push(`${name} ${i}`);
  }

  // Common business suffixes
  candidates.push(`${name} Co`);
  candidates.push(`${name} Group`);
  candidates.push(`${name} Shop`);
  candidates.push(`${name} Store`);
  candidates.push(`${name} Hub`);
  candidates.push(`${name} ${year}`);

  // "The" prefix if not already present
  if (!name.toLowerCase().startsWith('the ')) {
    candidates.push(`The ${name}`);
  }

  return candidates;
}
