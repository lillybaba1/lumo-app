import { NextResponse } from 'next/server';
import { getHeroData } from '@/app/admin/hero/actions';

export async function GET() {
  try {
    const heroData = await getHeroData();
    return NextResponse.json(heroData || { products: [] });
  } catch (error) {
    console.error('Failed to fetch hero data:', error);
    return NextResponse.json(
      { products: [] },
      { status: 200 } // Return empty hero data instead of error
    );
  }
}
