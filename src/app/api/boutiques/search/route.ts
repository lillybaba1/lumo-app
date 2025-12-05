import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '5');

    if (query.length < 2) {
      return NextResponse.json([]);
    }

    // Search boutiques by display name
    const { data: boutiques, error } = await supabaseAdmin
      .from('boutiques')
      .select(`
        id,
        slug,
        display_name,
        tagline,
        logo,
        total_products,
        is_published
      `)
      .eq('is_published', true)
      .ilike('display_name', `%${query}%`)
      .limit(limit);

    if (error) {
      console.error('Boutique search error:', error);
      return NextResponse.json([]);
    }

    const mapped = (boutiques || []).map(b => ({
      id: b.id,
      slug: b.slug,
      displayName: b.display_name,
      tagline: b.tagline,
      logo: b.logo,
      totalProducts: b.total_products || 0,
    }));

    return NextResponse.json(mapped, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('Boutique search error:', error);
    return NextResponse.json([]);
  }
}
