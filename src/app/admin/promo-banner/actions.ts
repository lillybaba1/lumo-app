'use server';

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { PromoBannerSettings, DEFAULT_PROMO_BANNER_SETTINGS, Product } from '@/lib/types';

const PROMO_BANNER_KEY = 'promo_banner_settings';

export async function getPromoBannerSettings(): Promise<PromoBannerSettings> {
  try {
    const { data, error } = await supabaseAdmin
      .from('site_settings')
      .select('value')
      .eq('key', PROMO_BANNER_KEY)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found, return defaults
        return DEFAULT_PROMO_BANNER_SETTINGS;
      }
      throw error;
    }

    return { ...DEFAULT_PROMO_BANNER_SETTINGS, ...data?.value } as PromoBannerSettings;
  } catch (error) {
    console.error('Failed to get promo banner settings:', error);
    return DEFAULT_PROMO_BANNER_SETTINGS;
  }
}

export async function savePromoBannerSettings(settings: PromoBannerSettings): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('site_settings')
      .upsert(
        {
          key: PROMO_BANNER_KEY,
          value: settings,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'key' }
      );

    if (error) {
      console.error('Failed to save promo banner settings:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error saving promo banner settings:', error);
    return false;
  }
}

export async function getAllProducts(): Promise<Product[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('status', 'active')
      .order('name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to get products:', error);
    return [];
  }
}
