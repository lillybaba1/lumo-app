'use server';

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { HeroData } from '@/lib/types';

export async function getHeroData(): Promise<HeroData | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('site_settings')
      .select('value')
      .eq('key', 'hero_products')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No data found, return default
        return {
          products: [],
          heroLabelText: 'Featured',
          heroLabelPosition: { x: 10, y: 15 }
        };
      }
      throw error;
    }

    const value = data?.value as HeroData | undefined;
    return value || { products: [], heroLabelText: 'Featured', heroLabelPosition: { x: 10, y: 15 } };
  } catch (error) {
    console.error('Failed to get hero data:', error);
    return { products: [], heroLabelText: 'Featured', heroLabelPosition: { x: 10, y: 15 } };
  }
}

export async function saveHeroData(heroData: HeroData) {
  try {
    const { error } = await supabaseAdmin
      .from('site_settings')
      .upsert({
        key: 'hero_products',
        value: {
          ...heroData,
          updatedAt: new Date().toISOString()
        },
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
  } catch (error) {
    console.error('Failed to save hero data:', error);
    throw new Error('Failed to save hero data.');
  }
}
