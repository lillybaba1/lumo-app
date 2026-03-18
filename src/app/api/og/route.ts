import { NextRequest, NextResponse } from 'next/server';

// This route proxies product images through our domain
// so social media crawlers (WhatsApp, Facebook, Telegram, etc.)
// can reliably fetch them for link previews.
//
// Supabase storage images sometimes don't render in previews due to
// cache-control: no-cache headers or cross-origin restrictions.

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return new NextResponse('Missing url parameter', { status: 400 });
  }

  // Only allow Supabase storage URLs for security
  if (!imageUrl.includes('supabase.co/storage')) {
    return new NextResponse('Invalid image URL', { status: 400 });
  }

  try {
    const response = await fetch(imageUrl, {
      headers: {
        'Accept': 'image/*',
      },
    });

    if (!response.ok) {
      return new NextResponse('Failed to fetch image', { status: 502 });
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const imageBuffer = await response.arrayBuffer();

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch {
    return new NextResponse('Error fetching image', { status: 500 });
  }
}
