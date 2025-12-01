import { NextResponse } from 'next/server';
import { getHeroData } from '@/app/admin/hero/actions';

// Disable caching for this route to always get fresh hero data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const heroData = await getHeroData();
    
    // Ensure we always return complete hero data with position
    const response = {
      products: heroData?.products || [],
      heroLabelText: heroData?.heroLabelText || 'Featured',
      heroLabelPosition: heroData?.heroLabelPosition || { x: 10, y: 15 },
    };
    
    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Failed to fetch hero data:', error);
    return NextResponse.json(
      { products: [], heroLabelText: 'Featured', heroLabelPosition: { x: 10, y: 15 } },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  }
}
