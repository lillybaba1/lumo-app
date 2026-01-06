import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { DEFAULT_PROMO_BANNER_SETTINGS, PromoBannerSettings } from '@/lib/types';

const PROMO_BANNER_KEY = 'promo_banner_settings';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('site_settings')
      .select('value')
      .eq('key', PROMO_BANNER_KEY)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found, return defaults
        return NextResponse.json(DEFAULT_PROMO_BANNER_SETTINGS);
      }
      throw error;
    }

    const settings: PromoBannerSettings = { ...DEFAULT_PROMO_BANNER_SETTINGS, ...data?.value };
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Failed to get promo banner settings:', error);
    return NextResponse.json(DEFAULT_PROMO_BANNER_SETTINGS);
  }
}
